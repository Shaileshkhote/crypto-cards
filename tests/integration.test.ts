import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { executeJob } from "@cards/core/runner";
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { db, closeDb, publish, transaction, type CardRow } from "@cards/db";
import { migrate } from "../packages/db/src/migrate";
import { syncAdapter } from "@cards/core/sync";
import * as syncFunctions from "@cards/core/sync";
import { Budget, RunError, type Extractor } from "@cards/core/agent";
import { listReviews, approveReview, rejectReview } from "@cards/core/review";
import { readCache, rebuildCache } from "@cards/core/cache";
import { publicationHash } from "@cards/core/merge";
import { enqueue, claimJob } from "@cards/core/jobs";
import { adapter, document, extraction } from "./helpers";
import { Card } from "@cards/core/schema";
import { loadAdapters } from "@cards/core/adapters";
import { documentFromText } from "@cards/core/crawler";
const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)(
  "PostgreSQL sync, review, history, jobs and public cache",
  () => {
    beforeAll(async () => {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      await migrate();
    });
    beforeEach(async () => {
      await db().query(
        "TRUNCATE cards,card_sources,card_extractions,card_versions,card_reviews,jobs,cache_entries RESTART IDENTITY",
      );
    });
    afterAll(closeDb);
    const read = async () =>
      Card.parse(
        (
          await db().query<CardRow>("SELECT * FROM cards WHERE id=$1", [
            "example",
          ])
        ).rows[0].data,
      );
    const run = async (rate = 1.5, extractor?: Extractor) => {
      const doc = document(rate);
      return syncAdapter(adapter(), new Budget(), {
        fetch: async () => doc,
        extract:
          extractor ||
          (async (_a, docs) => ({
            extraction: extraction(doc, rate),
            documents: docs,
            issues: [],
          })),
      });
    };
    it("cold sync publishes, warm unchanged sync makes zero agent calls and byte-identical cache", async () => {
      expect((await run()).status).toBe("published");
      const before = await readCache("cards/example");
      let calls = 0;
      const r = await run(1.5, async () => {
        calls++;
        throw new Error("must not execute");
      });
      expect(r.status).toBe("unchanged");
      expect(calls).toBe(0);
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      expect((await db().query("SELECT * FROM card_versions")).rowCount).toBe(
        1,
      );
    });
    it("persists distinct material fees, reuses them warm and holds a changed price for review", async () => {
      const a = adapter();
      const sync = async (price: number, warm = false) => {
        const doc = documentFromText(a.sources.urls[0], `Additional Metal card: ${price} USD. Additional Plastic card: 0 USD.`);
        const e = extraction(doc);
        e.facts[0].value = [
          { id: "metal", kind: "issuance", calculation: "fixed", fixed: { amount: String(price), currency: "USD" }, scope: { cardOrder: "additional", conditions: ["Metal"] }, calculable: true },
          { id: "plastic", kind: "issuance", calculation: "fixed", fixed: { amount: "0", currency: "USD" }, scope: { cardOrder: "additional", conditions: ["Plastic"] }, calculable: true },
        ];
        return syncAdapter(a, new Budget(0), { fetch: async () => doc, extract: async () => {
          if (warm) throw new Error("Warm extraction must be cached");
          return { extraction: e, documents: [doc], issues: [] };
        } });
      };
      expect((await sync(150)).status).toBe("published");
      const first = await read();
      const fees = () => read().then(card => card.products![0].tiers![0].fees!);
      expect(await fees()).toHaveLength(2);
      expect((await sync(150, true)).status).toBe("unchanged");
      expect(await read()).toEqual(first);
      expect((await sync(200)).status).toBe("review");
      expect((await fees()).map(fee => fee.calculation === "fixed" && fee.fixed.amount).sort()).toEqual(["0", "150"]);
      const [proposal] = await listReviews();
      await approveReview(proposal.id, "test-admin");
      expect((await fees()).map(fee => fee.calculation === "fixed" && fee.fixed.amount).sort()).toEqual(["0", "200"]);
    });
    it("holds changed FX fee; approval changes the reviewed scope and caches only committed data", async () => {
      await run();
      const cache = await readCache("cards/example");
      expect((await run(2)).status).toBe("review");
      expect((await readCache("cards/example"))?.payload).toBe(cache?.payload);
      const [review] = await listReviews();
      expect(review.base_version).toBe(1);
      expect(
        (review.context as { labels: string[] }).labels.some((label) =>
          label.includes("DE"),
        ),
      ).toBe(true);
      expect(
        (review.context as { evidence: { quote: string }[] }).evidence.some(
          (e) => e.quote.includes("2%"),
        ),
      ).toBe(true);
      expect((await approveReview(review.id, "test-admin")).cacheUpdated).toBe(
        true,
      );
      expect((await read()).products?.[0].tiers?.[0].fees?.[0]).toMatchObject({
        ratePercent: 2,
      });
      expect((await db().query("SELECT * FROM card_versions")).rowCount).toBe(
        2,
      );
    });
    it("rejection preserves publication", async () => {
      await run();
      const before = await readCache("cards/example");
      await run(2);
      const [r] = await listReviews();
      await rejectReview(r.id, "test-admin");
      expect(await listReviews()).toHaveLength(0);
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      expect((await run(2)).status).toBe("unchanged");
      expect(await listReviews()).toHaveLength(0);
    });
    it("supersedes an older proposal without allowing approval from an outdated screen", async () => {
      await run();
      const before = await readCache("cards/example");
      await run(2);
      const [older] = await listReviews();
      await run(3);
      const [current] = await listReviews();
      expect(await listReviews()).toHaveLength(1);
      expect(current.id).not.toBe(older.id);
      await expect(approveReview(older.id, "admin")).rejects.toThrow("Pending review not found");
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      await run(3);
      expect((await listReviews()).map(r => r.id)).toEqual([current.id]);
      await approveReview(current.id, "admin");
      expect((await read()).products?.[0].tiers?.[0].fees?.[0]).toMatchObject({ ratePercent: 3 });
    });
    it("rejects stale approvals after a concurrent publication", async () => {
      await run();
      await run(2);
      const [r] = await listReviews();
      const changed = { ...(await read()), kyc: true };
      await transaction((c) =>
        publish(c, "example", changed, publicationHash(changed), 1),
      );
      await expect(approveReview(r.id, "admin")).rejects.toThrow("stale");
    });
    it("404, invalid evidence, incomplete extraction and budget failures retain accepted data", async () => {
      await run();
      const before = await readCache("cards/example");
      const unavailable = {
        ...document(),
        status: "unavailable" as const,
        error: "HTTP 404",
      };
      expect(
        (
          await syncAdapter(adapter(), new Budget(), {
            fetch: async () => unavailable,
          })
        ).status,
      ).toBe("failed");
      for (const mode of ["evidence", "incomplete", "scope", "number", "budget", "configuration"]) {
        const r = await run(2, async (_a, docs, b) => {
          if (mode === "budget") {
            b.reserve(6);
            throw new Error("unreachable");
          }
          if (mode === "configuration") throw new RunError("OpenRouter HTTP 401: invalid credentials");
          const e = extraction(docs[0], 2);
          if (mode === "evidence") e.facts[0].evidence.quote = "fabricated";
          else if (mode === "scope") (e.facts[0].value as { scope: { tierIds?: string[] } }[])[0].scope.tierIds = ["luxe"];
          else if (mode === "number") (e.facts[0].value as { ratePercent: number }[])[0].ratePercent = 99;
          else e.complete = false;
          return { extraction: e, documents: docs, issues: [] };
        });
        expect(r.status).toBe("failed");
        expect(r.haltRun).toBe(["budget", "configuration"].includes(mode) ? true : undefined);
        expect((await readCache("cards/example"))?.payload).toBe(
          before?.payload,
        );
      }
    });
    it("retains values and source history when an adapter replaces a source URL", async () => {
      await run();
      const a = adapter();
      a.sources.urls = ["https://example.com/replacement"];
      const doc = { ...document(), url: a.sources.urls[0] };
      const result = await syncAdapter(a, new Budget(), {
        fetch: async () => doc,
        extract: async () => ({ extraction: { complete: true, products: [], tiers: [], facts: [] }, documents: [doc], issues: [] }),
      });
      expect(result.status).toBe("review");
      const tier = (await read()).products![0].tiers![0];
      expect(tier.fees![0]).toMatchObject({ ratePercent: 1.5, status: "unconfirmed" });
      expect(tier.unconfirmedFields).toContain("fees");
      const sources = (await db().query("SELECT url,snapshot FROM card_sources WHERE card_id='example'")).rows;
      expect(sources).toHaveLength(2);
      expect(sources.find(source => source.url === "https://example.com/fees")?.snapshot).toBeTruthy();
    });
    it("static-only changes require no model request and sensitive changes remain pending", async () => {
      await run();
      const a = adapter();
      a.static = { kyc: false };
      const r = await syncAdapter(a, new Budget(), {
        staticOnly: true,
        extract: async () => {
          throw new Error("no model");
        },
      });
      expect(r.status).toBe("published");
      expect((await read()).kyc).toBe(false);
      a.static.kyc = true;
      const next = await syncAdapter(a, new Budget(), { staticOnly: true });
      expect(next.status).toBe("review");
      expect((await read()).kyc).toBe(false);
    });
    it("marks missing accepted facts unconfirmed without deleting the fee", async () => {
      await run();
      const doc = document(3);
      const r = await syncAdapter(adapter(), new Budget(), {
        fetch: async () => doc,
        extract: async (_a, docs) => ({
          extraction: { complete: true, products: [], tiers: [], facts: [] },
          documents: docs,
          issues: [],
        }),
      });
      expect(r.status).toBe("review");
      const card = await read();
      expect(card.products?.[0].tiers?.[0].fees).toHaveLength(1);
      expect(card.products?.[0].tiers?.[0].unconfirmedFields).toContain("fees");
    });
    it("executes a queued job through the same core across SQL claim boundaries", async () => {
      await run();
      const id = await enqueue("cache");
      const claimed = await claimJob();
      expect(claimed?.id).toBe(id);
      expect((await executeJob(claimed!)).status).toBe("completed");
      await rebuildCache();
      expect(await readCache("cards")).toBeTruthy();
    });
    it("continues all-adapter work after an accounted timeout, but halts on budget exhaustion", async () => {
      for (const haltRun of [false, true]) {
        const mocked = vi.spyOn(syncFunctions, "syncAdapter").mockImplementation(async (a) => ({
          cardId: a.config.id, status: "failed", changed: 0, reused: 0, proposed: 0, costUsd: 0, inputTokens: 0, outputTokens: 0,
          error: haltRun ? "Budget exhausted: no new OpenRouter request sent" : "OpenRouter response timed out; reservation retained conservatively", haltRun,
        }));
        try {
          const id = await enqueue("sync");
          const claimed = await claimJob();
          expect(claimed?.id).toBe(id);
          const result = await executeJob(claimed!);
          expect(result.status).toBe("failed");
          expect(mocked.mock.calls.length).toBe(haltRun ? 1 : (await loadAdapters()).length);
          if (haltRun) expect((result.progress.results as { error?: string }[])[1].error).toBe("Run stopped: Budget exhausted: no new OpenRouter request sent");
        } finally { mocked.mockRestore(); }
      }
    });
    it("approves from the CLI without an extra required reviewer flag", async () => {
      await run();
      await run(2);
      const [review] = await listReviews();
      const result = await promisify(execFile)(
        process.execPath,
        ["--import", "tsx", "apps/worker/src/cli.ts", "approve", review.id],
        {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
          encoding: "utf8",
        },
      );
      expect(JSON.parse(result.stdout)).toMatchObject({
        cardId: "example", version: 2, cacheUpdated: true,
      });
      expect((await read()).products?.[0].tiers?.[0].fees?.[0]).toMatchObject({
        ratePercent: 2,
      });
    });

  },
);
