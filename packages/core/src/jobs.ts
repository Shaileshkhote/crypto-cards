import { randomUUID } from "node:crypto";
import { db, type JobRow } from "@cards/db";
import { loadAdapters } from "./adapters";
import { cacheMismatch } from "./cache";
export async function enqueue(
  kind: "sync" | "cache",
  cardId: string | null = null,
  force = false,
) {
  if (
    kind === "sync" &&
    cardId &&
    !(await loadAdapters()).some((a) => a.config.id === cardId)
  )
    throw new Error(`Unknown adapter: ${cardId}`);
  const id = randomUUID();
  await db().query(
    "INSERT INTO jobs(id,kind,card_id,force) VALUES($1,$2,$3,$4)",
    [id, kind, cardId, force],
  );
  return id;
}
export async function claimJob() {
  return (
    await db().query<JobRow>(
      `UPDATE jobs SET status='running',started_at=now(),heartbeat_at=now() WHERE id=(SELECT id FROM jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`,
    )
  ).rows[0];
}
export async function reclaimJobs() {
  // Interrupted jobs are failed explicitly; a user can retry them. Never auto-run a
  // second paid extraction while an expired process may still be alive.
  await db().query(
    "UPDATE jobs SET status='failed',error='Worker interrupted or heartbeat expired; retry explicitly',completed_at=now() WHERE status='running' AND heartbeat_at < now()-interval '10 minutes'",
  );
}
export async function status() {
  const [jobs, counts, cost, cache] = await Promise.all([
    db().query<JobRow>("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50"),
    db().query<{ cards: string; reviews: string; failures: string }>(
      "SELECT (SELECT count(*) FROM cards) cards,(SELECT count(*) FROM card_reviews WHERE status='pending') reviews,(SELECT count(*) FROM jobs WHERE status='failed') failures",
    ),
    db().query<{ total: string }>(
      "SELECT coalesce(sum(cost_usd),0) total FROM jobs",
    ),
    cacheMismatch(),
  ]);
  return {
    jobs: jobs.rows,
    ...counts.rows[0],
    totalCostUsd: cost.rows[0].total,
    cacheMismatches: Number(cache),
  };
}
