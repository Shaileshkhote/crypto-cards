import { mkdir, writeFile } from "node:fs/promises";
import { loadAdapters } from "@cards/core/adapters";
import { Budget, extractionSettings } from "@cards/core/agent";
import { syncAdapter } from "@cards/core/sync";
import { closeDb } from "@cards/db";
async function run() {
  const ids = process.argv.slice(2);
  const all = await loadAdapters();
  if (ids.includes("--all") && ids.length !== 1)
    throw new Error("Use --all alone or list provider IDs");
  const selected = ids[0] === "--all" ? all.map(a => a.config.id) : ids.length
    ? ids
    : ["etherfi", "avici", "mexc", "nexo-card", "revolut"];
  const adapters = all.filter((x) =>
    selected.includes(x.config.id),
  );
  if (adapters.length !== selected.length)
    throw new Error("Unknown or retired benchmark provider");
  // Cold and warm passes share the run's cap, including changed warm sources.
  const budget = new Budget();
  let coldUsd = 0, warmUsd = 0;
  const started = Date.now();
  const results = [];
  for (const a of adapters) {
    const at = Date.now();
    const first = await syncAdapter(a, budget, { force: true });
    coldUsd += first.costUsd;
    const second =
      first.status === "failed" ? null : await syncAdapter(a, budget);
    warmUsd += second?.costUsd || 0;
    results.push({
      provider: a.config.id,
      cold: first,
      warm: second,
      elapsedMs: Date.now() - at,
    });
  }
  const report = {
    settings: extractionSettings(),
    results,
    elapsedMs: Date.now() - started,
    coldUsd,
    warmUsd,
    totalUsd: budget.spent,
    maxUsd: budget.max,
    estimateFor50Providers: results.every((r) => r.cold.status !== "failed")
      ? (coldUsd / adapters.length) * 50
      : null,
    accuracy:
      "NOT EVALUATED: manually compare source quotes and label expected values before selecting a model",
  };
  await mkdir(".local", { recursive: true });
  await writeFile(".local/benchmark.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (results.some((r) => r.cold.status === "failed")) process.exitCode = 1;
}
run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(closeDb);
