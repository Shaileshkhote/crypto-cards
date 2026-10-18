import { executeJob } from "@cards/core/runner";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { db, closeDb, publish, transaction, type CardRow } from "@cards/db";
import { migrate } from "../packages/db/src/migrate";
import { syncAdapter } from "@cards/core/sync";
import { Budget, type Extractor } from "@cards/core/agent";
import { listReviews, approveReview, rejectReview } from "@cards/core/review";
import { readCache, rebuildCache } from "@cards/core/cache";
import { publicationHash } from "@cards/core/merge";
import { enqueue, claimJob } from "@cards/core/jobs";
import { adapter, document, extraction } from "./helpers";
import { Card } from "@cards/core/schema";
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
      for (const mode of ["evidence", "incomplete", "budget"]) {
        const r = await run(2, async (_a, docs, b) => {
          if (mode === "budget") {
            b.reserve(6);
            throw new Error("unreachable");
          }
          const e = extraction(docs[0], 2);
          if (mode === "evidence") e.facts[0].evidence.quote = "fabricated";
          else e.complete = false;
          return { extraction: e, documents: docs, issues: [] };
        });
        expect(r.status).toBe("failed");
        expect((await readCache("cards/example"))?.payload).toBe(
          before?.payload,
        );
      }
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
  },
);
