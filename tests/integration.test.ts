import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { executeJob } from "@cards/core/runner";
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { db, closeDb, publish, transaction, getPublishedCard, listPublishedCards, type CardRow } from "@cards/db";
import { migrate } from "../packages/db/src/migrate";
import { syncAdapter } from "@cards/core/sync";
import * as syncFunctions from "@cards/core/sync";
import { Budget, RunError, type Extractor } from "@cards/core/agent";
import { listReviews, approveReview, rejectReview } from "@cards/core/review";
import { readCache, rebuildCache } from "@cards/core/cache";
import { publicationHash, preserveSourceDisagreements, MERGE_VERSION } from "@cards/core/merge";
import { enqueue, claimJob, status } from "@cards/core/jobs";
import { adapter, document, extraction } from "./helpers";
import { Card } from "@cards/core/schema";
import { loadAdapters } from "@cards/core/adapters";
import { documentFromText } from "@cards/core/crawler";
const enabled = !!process.env.TEST_DATABASE_URL;
// Confirmation metadata may change immediately while a changed price remains
// held. All accepted values and their original provenance must stay intact.
const withoutConfirmation = (value: unknown): unknown => Array.isArray(value)
  ? value.map(withoutConfirmation)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).filter(([key]) => !["status", "unconfirmedFields"].includes(key)).map(([key, entry]) => [key, withoutConfirmation(entry)]))
    : value;
describe.skipIf(!enabled)(
  "PostgreSQL sync, review, history, jobs and public cache",
  () => {
    beforeAll(async () => {
      process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
      await migrate();
      await loadAdapters(undefined, { includeRetired: true });
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
    it("re-extracts a cached record that fails current evidence checks without changing accepted values", async () => {
      await run();
      const before = await readCache("cards/example"), doc = document();
      await db().query("UPDATE card_extractions SET data=$1", [JSON.stringify(extraction(doc, 99))]);
      let calls = 0;
      const repaired = await run(1.5, async () => {
        calls++;
        return { extraction: extraction(doc), documents: [doc], issues: [] };
      });
      expect(repaired).toMatchObject({ status: "unchanged", changed: 1, reused: 0 });
      expect(repaired.issues?.some(issue => issue.includes("Cached extraction needs re-extraction"))).toBe(true);
      expect(calls).toBe(1);
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      expect((await run(1.5, async () => { throw new Error("Repaired cache must be reused"); })).status).toBe("unchanged");
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
    });
    it("refreshes an immutable proposal after merge rules change before allowing approval", async () => {
      await run();
      expect((await run(2)).status).toBe("review");
      const old = (await listReviews())[0];
      await db().query("UPDATE card_reviews SET context=jsonb_set(context,'{mergeVersion}',$2::jsonb) WHERE id=$1", [old.id, JSON.stringify("legacy")]);
      await expect(approveReview(old.id, "test-admin")).rejects.toThrow("merge rules changed");
      expect((await run(2, async () => { throw new Error("Valid source cache must be reused"); })).status).toBe("review");
      const fresh = (await listReviews())[0];
      expect(fresh.id).not.toBe(old.id);
      expect(fresh.context).toMatchObject({ mergeVersion: MERGE_VERSION });
      const historical = (await db().query("SELECT status,changes,base_version FROM card_reviews WHERE id=$1", [old.id])).rows[0];
      expect(historical).toMatchObject({ status: "superseded", changes: old.changes, base_version: old.base_version });
      await approveReview(fresh.id, "test-admin");
      expect((await read()).products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 2 });
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
      const held = await read();
      expect(withoutConfirmation(held)).toEqual(withoutConfirmation(JSON.parse(cache!.payload)));
      expect(held.products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 1.5, status: "unconfirmed" });
      const [review] = await listReviews();
      expect(review.base_version).toBe(2);
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
        3,
      );
      const approvedCache = await readCache("cards/example");
      expect((await run(2, async () => { throw new Error("Approved unchanged sources must reuse extraction"); })).status).toBe("unchanged");
      expect((await readCache("cards/example"))?.payload).toBe(approvedCache?.payload);
      expect((await db().query("SELECT * FROM card_versions")).rowCount).toBe(3);
    });
    it("rejection preserves publication", async () => {
      await run();
      const original = await read();
      await run(2);
      const before = await readCache("cards/example");
      expect(withoutConfirmation(await read())).toEqual(withoutConfirmation(original));
      const [r] = await listReviews();
      await rejectReview(r.id, "test-admin");
      expect(await listReviews()).toHaveLength(0);
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      expect((await run(2)).status).toBe("unchanged");
      expect(await listReviews()).toHaveLength(0);
    });
    it("supersedes an older proposal without allowing approval from an outdated screen", async () => {
      await run();
      await run(2);
      const before = await readCache("cards/example");
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
        publish(c, "example", changed, publicationHash(changed), r.base_version),
      );
      await expect(approveReview(r.id, "admin")).rejects.toThrow("stale");
    });
    it.each([0, 1])("reuses validated sources when source %i fails and reconciles cached competing prices", async (failedIndex) => {
      await run();
      const before = await readCache("cards/example"), a = adapter();
      const docs = [documentFromText(a.sources.urls[0], "Core FX fee: 2.5% for residents of Germany."), documentFromText("https://example.com/other", "Core FX fee: 3.5% for residents of Germany.")];
      a.sources.urls = docs.map(doc => doc.url);
      const fetch = async (url: string) => docs.find(doc => doc.url === url)!;
      const first = await syncAdapter(a, new Budget(1), { fetch, extract: async (_a, input, budget) => {
        expect(input).toHaveLength(1);
        if (input[0].url === docs[failedIndex].url) throw new Error("Source failed");
        budget.reserve(0.01); budget.settle(0.01, 0.006, 100, 20);
        return { extraction: extraction(input[0], failedIndex ? 2.5 : 3.5), documents: input, issues: [] };
      } });
      expect(first.status).toBe("failed");
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
      const retry = await syncAdapter(a, new Budget(1), { fetch, extract: async (_a, input, budget) => {
        expect(input.map(doc => doc.url)).toEqual([docs[failedIndex].url]);
        budget.reserve(0.01); budget.settle(0.01, 0.008, 200, 30);
        return { extraction: extraction(input[0], failedIndex ? 3.5 : 2.5), documents: input, issues: [] };
      } });
      expect(retry).toMatchObject({ status: "review", changed: 1, reused: 1, costUsd: 0.008 });
      expect((await read()).products![0].tiers![0].fees![0]).toMatchObject({ calculation: "percentage", ratePercent: 1.5, status: "unconfirmed" });
      expect(retry.issues!.some(issue => issue.includes("Conflicting source claims"))).toBe(true);
      const usage = (await db().query("SELECT sum(cost_usd)::float AS cost, sum(input_tokens)::int AS input, sum(output_tokens)::int AS output FROM card_extractions")).rows[0];
      expect(usage).toEqual({ cost: 0.014, input: 300, output: 50 });
      const stable = await readCache("cards/example");
      const versions = (await db().query("SELECT count(*) AS n FROM card_versions")).rows[0].n;
      const warm = await syncAdapter(a, new Budget(0), { fetch, extract: async () => { throw new Error("Validated sources must be reused"); } });
      expect(warm).toMatchObject({ status: "review", changed: 0, reused: 2, costUsd: 0 });
      expect((await readCache("cards/example"))?.payload).toBe(stable?.payload);
      expect((await db().query("SELECT count(*) AS n FROM card_versions")).rows[0].n).toBe(versions);
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
      const pending = (await listReviews())[0];
      const cached = await readCache("cards/example");
      const warm = await syncAdapter(adapter(), new Budget(0), {
        fetch: async () => doc,
        extract: async () => { throw new Error("Unchanged source must use its cached extraction"); },
      });
      expect(warm).toMatchObject({ status: "review", changed: 0, proposed: r.proposed, costUsd: 0 });
      expect((await listReviews())[0]).toEqual(pending);
      expect((await readCache("cards/example"))?.payload).toBe(cached?.payload);
      // Acknowledging missing evidence leaves the retained fee unconfirmed and
      // must not create a fresh identical review on every scheduled warm run.
      await approveReview(pending.id, "reviewer@example.com");
      const acknowledged = await syncAdapter(adapter(), new Budget(0), {
        fetch: async () => doc,
        extract: async () => { throw new Error("Unchanged source must use its cached extraction"); },
      });
      expect(acknowledged).toMatchObject({ status: "unchanged", proposed: 0, costUsd: 0 });
      expect(await listReviews()).toHaveLength(0);
      expect((await read()).products?.[0].tiers?.[0].fees![0].status).toBe("unconfirmed");
    });
    it("keeps an approved source-disagreement acknowledgment stable after publishing its terms", async () => {
      const a = adapter();
      const first = document(1.5);
      const initial = extraction(first);
      initial.facts[0].tierId = null;
      expect((await syncAdapter(a, new Budget(0), {
        fetch: async () => first,
        extract: async () => ({ extraction: initial, documents: [first], issues: [] }),
      })).status).toBe("published");
      const accepted = await read();
      const second = documentFromText("https://example.com/terms", "Core FX fee: 3%.");
      a.sources.urls.push(second.url);
      const conflicting = extraction(second, 3);
      conflicting.facts[0].tierId = null;
      const reconciled = preserveSourceDisagreements({ ...initial, facts: [...initial.facts, ...conflicting.facts] });
      const sync = (warm = false) => syncAdapter(a, new Budget(0), {
        fetch: async url => url === first.url ? first : second,
        extract: async () => {
          if (warm) throw new Error("Unchanged evidence must use cached extraction");
          return { ...reconciled, documents: [first, second] };
        },
      });
      expect((await sync()).status).toBe("review");
      const [review] = await listReviews();
      await approveReview(review.id, "test-admin");
      const before = await readCache("cards/example");
      const card = await read();
      expect(card.products![0].terms).toHaveLength(2);
      expect(card.products![0].fees).toEqual(accepted.products![0].fees!.map(fee => ({ ...fee, status: "unconfirmed" })));
      expect(card.products![0].unconfirmedFields).toContain("fees");
      expect(await sync(true)).toMatchObject({ status: "unchanged", proposed: 0, costUsd: 0 });
      expect(await listReviews()).toHaveLength(0);
      expect((await readCache("cards/example"))?.payload).toBe(before?.payload);
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
    it("archives retired cards from counts, reviews and caches while retaining accepted data and history", async () => {
      await run();
      const retiredIds = ["safepal", "gnosis-pay"], reviewIds: string[] = [];
      for (const id of retiredIds) {
        const card = Card.parse({ id, name: id, website: "https://example.com", kyc: false });
        await transaction(c => publish(c, id, card, publicationHash(card), 0));
        await db().query("INSERT INTO card_sources(card_id,url,fetch_status) VALUES($1,$2,'ok')", [id, `https://example.com/${id}`]);
        await db().query("INSERT INTO card_extractions(card_id,fingerprint,source_hashes,data,model) VALUES($1,$1,'{}','{}','fixture')", [id]);
        const reviewId = randomUUID();
        reviewIds.push(reviewId);
        await db().query("INSERT INTO card_reviews(id,card_id,base_version,changes) VALUES($1,$2,1,'[]')", [reviewId, id]);
        await db().query("INSERT INTO cache_entries(key,payload,content_hash,card_version) VALUES($1,$2,'old-cache',1)", [`cards/${id}`, JSON.stringify(card)]);
      }
      const before = (await db().query("SELECT id,data,version,publication_hash FROM cards ORDER BY id")).rows;
      await rebuildCache();
      const after = (await db().query("SELECT id,data,version,publication_hash FROM cards ORDER BY id")).rows;
      expect(after).toEqual(before);
      expect((await db().query("SELECT id FROM cards WHERE retired ORDER BY id")).rows.map(r => r.id)).toEqual(["gnosis-pay", "safepal"]);
      expect((await listPublishedCards()).map(r => r.id)).toEqual(["example"]);
      expect(await status()).toMatchObject({ cards: "1", reviews: "0", cacheMismatches: 0 });
      expect(await listReviews()).toEqual([]);
      expect((JSON.parse((await readCache("cards"))!.payload) as { providerId: string }[]).every(row => row.providerId === "example")).toBe(true);
      for (const [index, id] of retiredIds.entries()) {
        expect(await readCache(`cards/${id}`)).toBeUndefined();
        expect(await getPublishedCard(id)).toBeUndefined();
        await expect(enqueue("sync", id, true)).rejects.toThrow("Adapter is retired");
        await expect(approveReview(reviewIds[index], "test-admin")).rejects.toThrow("Adapter is retired");
        expect((await db().query("SELECT count(*)::int AS n FROM card_versions WHERE card_id=$1", [id])).rows[0].n).toBe(1);
        expect((await db().query("SELECT count(*)::int AS n FROM card_sources WHERE card_id=$1", [id])).rows[0].n).toBe(1);
        expect((await db().query("SELECT count(*)::int AS n FROM card_extractions WHERE card_id=$1", [id])).rows[0].n).toBe(1);
      }
      expect((await db().query("SELECT count(*)::int AS n FROM card_reviews WHERE status='pending'")).rows[0].n).toBe(2);
      expect((await db().query("SELECT count(*)::int AS n FROM jobs")).rows[0].n).toBe(0);
    });
    it("skips an already queued retired-provider job without fetching or extracting", async () => {
      const id = randomUUID();
      await db().query("INSERT INTO jobs(id,kind,card_id,force) VALUES($1,'sync','gnosis-pay',true)", [id]);
      const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network must not run"));
      try {
        const job = await executeJob((await claimJob())!);
        expect(job.status).toBe("completed");
        expect(job.progress).toMatchObject({ requests: 0, results: [{ cardId: "gnosis-pay", status: "retired", costUsd: 0 }] });
        expect(fetch).not.toHaveBeenCalled();
        expect((await db().query("SELECT count(*)::int AS n FROM card_sources")).rows[0].n).toBe(0);
        expect((await db().query("SELECT count(*)::int AS n FROM cards")).rows[0].n).toBe(0);
      } finally { fetch.mockRestore(); }
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
          expect(mocked.mock.calls.some(([a]) => a.config.retired || ["safepal", "gnosis-pay"].includes(a.config.id))).toBe(false);
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
        cardId: "example", version: 3, cacheUpdated: true,
      });
      expect((await read()).products?.[0].tiers?.[0].fees?.[0]).toMatchObject({
        ratePercent: 2,
      });
    });

  },
);
