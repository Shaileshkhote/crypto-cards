import { userInfo } from "node:os";
import { executeJob } from "@cards/core/runner";
import { db, closeDb, type JobRow } from "@cards/db";
import { loadAdapters } from "@cards/core/adapters";
import { enqueue, status } from "@cards/core/jobs";
import { approveReview, rejectReview, listReviews } from "@cards/core/review";
import type { Change } from "@cards/core/merge";

const usage = `Usage:
 pnpm cards validate
 pnpm cards sync <provider> [--force] | sync --all [--force]
 pnpm cards status
 pnpm cards review [provider]
 pnpm cards approve <review-id> [--reviewer <name>]
 pnpm cards reject <review-id> [--reviewer <name>]
 pnpm cards cache
 pnpm db:migrate
`;
export async function main(args = process.argv.slice(2)) {
  const [command, arg] = args;
  if (command === "validate") {
    const a = await loadAdapters(undefined, { includeRetired: true });
    const active = a.filter(x => !x.config.retired);
    console.log(
      `Validated ${a.length} adapters: ${active.length} active, ${a.length - active.length} retired; ${active.reduce((n, x) => n + x.sources.urls.length, 0)} active source URLs`,
    );
    return;
  }
  if (command === "status") {
    console.log(JSON.stringify(await status(), null, 2));
    return;
  }
  if (command === "review") {
    const reviews = await listReviews(arg);
    if (!reviews.length) console.log("No pending reviews");
    for (const r of reviews) {
      console.log(
        `${r.id} | ${r.card_id} | published version ${r.base_version}`,
      );
      for (const [index, c] of (r.changes as Change[]).entries())
        console.log(
          `  ${(r.context as { labels?: string[] }).labels?.[index] || c.path.join(" → ")}: ${JSON.stringify(c.before) ?? "unknown"} → ${JSON.stringify(c.after) ?? "remove"} (${c.reason})`,
        );
    }
    return;
  }
  if (command === "approve" || command === "reject") {
    const i = args.indexOf("--reviewer");
    const reviewer = i >= 0 ? args[i + 1] : userInfo().username;
    if (!arg || !reviewer)
      throw new Error("Review ID required; --reviewer must have a name when supplied");
    const r = await (command === "approve" ? approveReview : rejectReview)(
      arg,
      reviewer,
    );
    console.log(JSON.stringify(r, null, 2));
    if ("cacheUpdated" in r && !r.cacheUpdated) process.exitCode = 1;
    return;
  }
  if (command === "sync" || command === "cache") {
    if (
      command === "sync" &&
      (!arg || (arg.startsWith("-") && arg !== "--all"))
    )
      throw new Error("Choose a provider or --all");
    const id = await enqueue(
      command === "cache" ? "cache" : "sync",
      arg === "--all" || command === "cache" ? null : arg,
      args.includes("--force"),
    );
    // Claim only this job: do not accidentally execute a different queued UI job.
    const row = (
      await db().query<JobRow>(
        "UPDATE jobs SET status='running',started_at=now(),heartbeat_at=now() WHERE id=$1 AND status='queued' RETURNING *",
        [id],
      )
    ).rows[0];
    if (!row) {
      console.log(`Queued ${id}; worker already claimed it`);
      return;
    }
    const job = await executeJob(row);
    console.log(JSON.stringify(job, null, 2));
    if (job.status !== "completed") process.exitCode = 1;
    return;
  }
  console.log(usage);
  if (command && command !== "--help") process.exitCode = 1;
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(closeDb);
