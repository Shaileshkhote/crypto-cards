import { executeJob } from "@cards/core/runner";
import { writeFile } from "node:fs/promises";
import { db, closeDb } from "@cards/db";
import { claimJob, reclaimJobs } from "@cards/core/jobs";
import { loadAdapters } from "@cards/core/adapters";
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
async function run() {
  await loadAdapters();
  await db().query("SELECT count(*) FROM jobs");
  console.log("Worker ready; polling PostgreSQL jobs");
  while (!stopping) {
    await reclaimJobs();
    await writeFile("/tmp/crypto-cards-worker-heartbeat", String(Date.now()));
    const job = await claimJob();
    if (job) {
      const timer = setInterval(() => {
        void writeFile(
          "/tmp/crypto-cards-worker-heartbeat",
          String(Date.now()),
        );
      }, 20_000);
      try {
        const result = await executeJob(job);
        console.log(`Job ${job.id}: ${result.status}`);
      } finally {
        clearInterval(timer);
      }
    } else await new Promise((r) => setTimeout(r, 1500));
  }
}
run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(closeDb);
