import { randomUUID } from "node:crypto";
import { db, publish, transaction, withLock, type CardRow } from "@cards/db";
import {
  Card,
  Extraction,
  type Adapter,
  type Document,
  type ExtractionData,
} from "./schema";
import { Crawler } from "./crawler";
import {
  extract,
  fingerprint,
  modelName,
  Budget,
  RunError,
  type Extractor,
} from "./agent";
import {
  candidate,
  merge,
  markUnconfirmed,
  publicationHash,
  unconfirmedChanges,
  MERGE_VERSION,
  describeChange,
} from "./merge";
import { canonical } from "./serialize";
import { rebuildCache } from "./cache";
export interface SyncResult {
  cardId: string;
  status: "published" | "unchanged" | "review" | "failed" | "not_run" | "retired";
  changed: number;
  reused: number;
  proposed: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
  haltRun?: boolean;
  issues?: string[];
}
interface Dependencies {
  fetch?: (url: string) => Promise<Document>;
  extract?: Extractor;
  force?: boolean;
  staticOnly?: boolean;
}
export async function syncAdapter(
  adapter: Adapter,
  budget: Budget,
  deps: Dependencies = {},
): Promise<SyncResult> {
  if (adapter.config.retired)
    return { cardId: adapter.config.id, status: "retired", changed: 0, reused: 0, proposed: 0, costUsd: 0, inputTokens: 0, outputTokens: 0, issues: ["Retired adapter; ingestion skipped"] };
  return withLock(`sync:${adapter.config.id}`, async () => {
    const start = {
      cost: budget.spent,
      input: budget.inputTokens,
      output: budget.outputTokens,
    };
    const result: SyncResult = {
      cardId: adapter.config.id,
      status: "unchanged",
      changed: 0,
      reused: 0,
      proposed: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    try {
      const id = adapter.config.id;
      const acceptedRow = (
        await db().query<CardRow>("SELECT * FROM cards WHERE id=$1", [id])
      ).rows[0];
      if (acceptedRow?.retired)
        return { ...result, status: "retired", issues: ["Retired adapter; ingestion skipped"] };
      const accepted = acceptedRow ? Card.parse(acceptedRow.data) : undefined;
      const prior = (
        await db().query<{
          url: string;
          snapshot: Document | null;
          content_hash: string | null;
        }>(
          "SELECT url,snapshot,content_hash FROM card_sources WHERE card_id=$1",
          [id],
        )
      ).rows;
      const crawler = new Crawler(adapter);
      const fetcher = deps.fetch || ((u: string) => crawler.fetch(u));
      const inventory = [
        ...new Set([
          ...adapter.sources.urls,
          ...(adapter.config.discovery ? prior.map((x) => x.url) : []),
        ]),
      ].sort();
      const documents: Document[] = [];
      const store = async (doc: Document) => {
        await db().query(
          `INSERT INTO card_sources(card_id,url,snapshot,content_hash,fetch_status,error,last_success_at) VALUES($1,$2,$3,$4,$5,$6,CASE WHEN $5='ok' THEN now() END)
     ON CONFLICT(card_id,url) DO UPDATE SET snapshot=CASE WHEN EXCLUDED.fetch_status='ok' THEN EXCLUDED.snapshot ELSE card_sources.snapshot END,content_hash=CASE WHEN EXCLUDED.fetch_status='ok' THEN EXCLUDED.content_hash ELSE card_sources.content_hash END,fetch_status=EXCLUDED.fetch_status,error=EXCLUDED.error,fetched_at=now(),last_success_at=CASE WHEN EXCLUDED.fetch_status='ok' THEN now() ELSE card_sources.last_success_at END`,
          [
            id,
            doc.url,
            doc.status === "ok" ? JSON.stringify(doc) : null,
            doc.status === "ok" ? doc.hash : null,
            doc.status,
            doc.error || null,
          ],
        );
      };
      if (deps.staticOnly) {
        documents.push(
          ...prior.flatMap((x) => (x.snapshot ? [x.snapshot] : [])),
        );
      } else {
        // Per-domain serialization is enforced by Crawler; global HTTP fanout is bounded here.
        for (let i = 0; i < inventory.length; i += 4) {
          const batch = await Promise.all(
            inventory.slice(i, i + 4).map(fetcher),
          );
          for (const doc of batch) {
            await store(doc);
            documents.push(doc);
          }
        }
        const failed = documents.filter((d) => d.status !== "ok");
        if (failed.length)
          throw new Error(
            failed.map((d) => `${d.url}: ${d.error || d.status}`).join("\n"),
          );
      }
      const snapshots = deps.staticOnly
        ? documents
        : documents.filter((d) => d.status === "ok");
      const extractions: ExtractionData[] = [];
      const pending: Document[] = [];
      for (const doc of snapshots) {
        const key = fingerprint(doc, adapter, inventory);
        const cached = (
          await db().query<{ data: ExtractionData }>(
            "SELECT data FROM card_extractions WHERE card_id=$1 AND fingerprint=$2",
            [id, key],
          )
        ).rows[0];
        if (cached && !deps.force) {
          extractions.push(Extraction.parse(cached.data));
          result.reused++;
        } else if (!deps.staticOnly) pending.push(doc);
      }
      result.changed = pending.length;
      if (pending.length) {
        const before = budget.spent;
        const extracted = await (deps.extract || extract)(
          adapter,
          pending,
          budget,
          adapter.config.discovery
            ? async (url) => {
                const doc = await fetcher(url);
                await store(doc);
                return doc;
              }
            : undefined,
        );
        const parsed = Extraction.parse(extracted.extraction);
        if (!parsed.complete)
          throw new Error("Incomplete extraction; published data retained");
        const allDocs = extracted.documents;
        if (allDocs.some((d) => d.status !== "ok"))
          throw new Error(
            "Discovered source is unreadable; published data retained",
          );
        const effectiveInventory = [
          ...new Set([...inventory, ...allDocs.map((d) => d.url)]),
        ].sort();
        // Validate the complete result before storing it as reusable extraction.
        candidate(adapter, [parsed], accepted, allDocs);
        extractions.push(parsed);
        for (const doc of allDocs) {
          if (!snapshots.some((d) => d.url === doc.url)) snapshots.push(doc);
          const part = {
            ...parsed,
            facts: parsed.facts.filter((f) => f.evidence.url === doc.url),
          };
          await db().query(
            "INSERT INTO card_extractions(card_id,fingerprint,source_hashes,data,model,input_tokens,output_tokens,cost_usd) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(card_id,fingerprint) DO UPDATE SET data=EXCLUDED.data,model=EXCLUDED.model,input_tokens=EXCLUDED.input_tokens,output_tokens=EXCLUDED.output_tokens,cost_usd=EXCLUDED.cost_usd,created_at=now()",
            [
              id,
              fingerprint(doc, adapter, effectiveInventory),
              JSON.stringify({ [doc.url]: doc.hash }),
              JSON.stringify(part),
              modelName(),
              Math.ceil((budget.inputTokens - start.input) / allDocs.length),
              Math.ceil((budget.outputTokens - start.output) / allDocs.length),
              (budget.spent - before) / allDocs.length,
            ],
          );
        }
      }
      const built = candidate(adapter, extractions, accepted, snapshots);
      const unconfirmed = accepted
        ? markUnconfirmed(accepted, [
            ...pending,
            ...prior.filter(source => !inventory.includes(source.url) && source.snapshot).map(source => source.snapshot!),
          ], extractions, built.data)
        : undefined;
      const merged = merge(unconfirmed, built.data);
      if (accepted && unconfirmed)
        merged.changes.push(...unconfirmedChanges(accepted, unconfirmed));
      let proposed = merged.changes.length;
      const version = await transaction(async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
          `publish:${id}`,
        ]);
        const version = await publish(
          c,
          id,
          merged.published,
          publicationHash(merged.published),
          acceptedRow?.version || 0,
        );
        await c.query(
          "UPDATE card_reviews SET status='superseded',resolved_at=now() WHERE card_id=$1 AND status='pending' AND base_version<>$2",
          [id, version],
        );
        if (merged.changes.length) {
          const duplicate = await c.query(
            "SELECT id,status FROM card_reviews WHERE card_id=$1 AND base_version=$2 AND status IN ('pending','rejected') AND changes=$3::jsonb",
            [id, version, JSON.stringify(merged.changes)],
          );
          if (duplicate.rows[0]?.status === "rejected") proposed = 0;
          // A review is immutable: a new proposal supersedes the old one so
          // a previously opened screen cannot approve unseen changed content.
          await c.query(
            "UPDATE card_reviews SET status='superseded',resolved_at=now() WHERE card_id=$1 AND status='pending' AND ($2::uuid IS NULL OR id<>$2)",
            [id, duplicate.rows[0]?.status === "pending" ? duplicate.rows[0].id : null],
          );
          if (!duplicate.rowCount)
            await c.query(
              "INSERT INTO card_reviews(id,card_id,base_version,changes,context) VALUES($1,$2,$3,$4,$5)",
              [
                randomUUID(),
                id,
                version,
                JSON.stringify(merged.changes),
                JSON.stringify({
                  mergeVersion: MERGE_VERSION,
                  labels: merged.changes.map((c) =>
                    describeChange(merged.published, c),
                  ),
                  evidence: extractions.flatMap((e) =>
                    e.facts.map((f) => ({
                      ...f.evidence,
                      productId: f.productId,
                      tierId: f.tierId,
                      field: f.field,
                    })),
                  ),
                  lastSeenAt: acceptedRow?.updated_at,
                  discrepancies: built.discrepancies,
                  discoveredUrls: snapshots
                    .filter((d) => !adapter.sources.urls.includes(d.url))
                    .map((d) => d.url),
                  unconfirmed: merged.published,
                  publicationInput: canonical({
                    static: adapter.static,
                    config: adapter.config,
                  }),
                }),
              ],
            );
        }
        if (!merged.changes.length)
          await c.query("UPDATE card_reviews SET status='superseded',resolved_at=now() WHERE card_id=$1 AND status='pending'", [id]);
        return version;
      });
      result.proposed = proposed;
      result.status = proposed
        ? "review"
        : version === (acceptedRow?.version || 0)
          ? "unchanged"
          : "published";
      result.issues = built.discrepancies.map((x) => `Static precedence: ${x}`);
      try {
        await rebuildCache();
      } catch (e) {
        result.issues.push(
          `Publication committed; cache rebuild failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        result.status = "failed";
        result.error = "Cache is behind PostgreSQL; run pnpm cards cache";
      }
    } catch (e) {
      result.status = "failed";
      result.error = e instanceof Error ? e.message : String(e);
      if (e instanceof RunError) result.haltRun = true;
    }
    result.costUsd = budget.spent - start.cost;
    result.inputTokens = budget.inputTokens - start.input;
    result.outputTokens = budget.outputTokens - start.output;
    return result;
  });
}
