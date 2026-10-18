import { mkdir, writeFile } from "node:fs/promises";
import { loadAdapters } from "@cards/core/adapters";
import { Budget, extractionSettings } from "@cards/core/agent";
import { syncAdapter } from "@cards/core/sync";
import { closeDb } from "@cards/db";
async function run() {
  const ids = process.argv.slice(2);
  const selected = ids.length
    ? ids
    : ["etherfi", "avici", "mexc", "gnosis-pay", "nexo-card", "revolut"];
  const adapters = (await loadAdapters()).filter((x) =>
    selected.includes(x.config.id),
  );
  if (adapters.length !== selected.length)
    throw new Error("Unknown benchmark provider");
  const cold = new Budget(),
    warm = new Budget();
  const started = Date.now();
  const results = [];
  for (const a of adapters) {
    const at = Date.now();
    const first = await syncAdapter(a, cold, { force: true });
    const second =
      first.status === "failed" ? null : await syncAdapter(a, warm);
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
    coldUsd: cold.spent,
    warmUsd: warm.spent,
    estimateFor50Providers: (cold.spent / adapters.length) * 50,
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
