import { db, withLock, type JobRow } from "@cards/db";
import { Budget } from "./agent";
import { loadAdapters } from "./adapters";
import { syncAdapter, type SyncResult } from "./sync";
import { rebuildCache } from "./cache";
export async function executeJob(job: JobRow) {
  const budget = new Budget(),
    results: SyncResult[] = [];
  const heartbeat = setInterval(() => {
    void db()
      .query(
        "UPDATE jobs SET heartbeat_at=now() WHERE id=$1 AND status='running'",
        [job.id],
      )
      .catch((e) => console.error("Heartbeat failed:", e.message));
  }, 15_000);
  try {
    await withLock("active-job", async () => {
      if (job.kind === "cache") {
        await rebuildCache();
        return;
      }
      const all = await loadAdapters(undefined, { includeRetired: true });
      await rebuildCache();
      const adapters = job.card_id
        ? all.filter((a) => a.config.id === job.card_id)
        : all.filter(a => !a.config.retired);
      if (job.card_id && !adapters.length) throw new Error("No matching adapters");
      let haltReason: string | undefined;
      for (const adapter of adapters) {
        const result: SyncResult = haltReason
          ? {
              cardId: adapter.config.id,
              status: "not_run",
              changed: 0,
              reused: 0,
              proposed: 0,
              costUsd: 0,
              inputTokens: 0,
              outputTokens: 0,
              error: `Run stopped: ${haltReason}`,
            }
          : await syncAdapter(adapter, budget, { force: job.force });
        results.push(result);
        if (result.haltRun) haltReason = result.error || "Fatal extraction error";
        await db().query(
          "UPDATE jobs SET progress=$2,cost_usd=$3,heartbeat_at=now() WHERE id=$1",
          [
            job.id,
            JSON.stringify({
              results,
              inputTokens: budget.inputTokens,
              outputTokens: budget.outputTokens,
              requests: budget.requests,
            }),
            budget.spent,
          ],
        );
      }
      if (results.some((r) => r.status === "failed" || r.status === "not_run"))
        throw new Error(
          `${results.filter((r) => r.status === "failed").length} adapters failed; ${results.filter((r) => r.status === "not_run").length} not run. See per-card errors.`,
        );
    });
    await db().query(
      "UPDATE jobs SET status='completed',completed_at=now() WHERE id=$1",
      [job.id],
    );
  } catch (e) {
    await db().query(
      "UPDATE jobs SET status='failed',error=$2,cost_usd=$3,completed_at=now() WHERE id=$1",
      [job.id, e instanceof Error ? e.message : String(e), budget.spent],
    );
  } finally {
    clearInterval(heartbeat);
  }
  return (await db().query<JobRow>("SELECT * FROM jobs WHERE id=$1", [job.id]))
    .rows[0];
}
