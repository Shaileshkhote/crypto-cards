import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadAdapters } from "@cards/core/adapters";
import { Budget, extract, extractionSettings, RunError } from "@cards/core/agent";
import { documentFromText } from "@cards/core/crawler";
import { matchesClaim, type Claim } from "./evaluation-claims";

interface Golden {
  id: string; provider: string; url: string; text: string; preserveLayout?: boolean;
  expected: Claim[]; forbidden: Claim[];
}
async function run() {
  const allFixtures: Golden[] = JSON.parse(await readFile("tests/fixtures/live-providers.json", "utf8"));
  const adapters = await loadAdapters(undefined, { includeRetired: true });
  for (const fixture of allFixtures)
    if (!adapters.some(a => a.config.id === fixture.provider)) throw new Error(`Unknown fixture provider: ${fixture.provider}`);
  const retiredFixtures = allFixtures.filter(f => adapters.find(a => a.config.id === f.provider)!.config.retired);
  const fixtures = allFixtures.filter(f => !adapters.find(a => a.config.id === f.provider)!.config.retired);
  const budget = new Budget(Number(process.env.MAX_RUN_COST_USD || 1));
  const results = [];
  for (const fixture of fixtures) {
    const adapter = adapters.find(a => a.config.id === fixture.provider)!;
    const started = Date.now(), before = budget.spent;
    try {
      const doc = documentFromText(fixture.url, fixture.text, fixture.url, [], fixture.preserveLayout);
      const { extraction } = await extract(adapter, [doc], budget);
      const matches = (claim: Claim) => matchesClaim(extraction, claim);
      const missing = fixture.expected.filter(c => !matches(c));
      const unsupported = fixture.forbidden.filter(matches);
      results.push({ id: fixture.id, passed: !missing.length && !unsupported.length, missing, unsupported, extraction, costUsd: budget.spent-before, elapsedMs: Date.now()-started });
    } catch (error) {
      results.push({ id: fixture.id, passed: false, error: error instanceof Error ? error.message : String(error), costUsd: budget.spent-before, elapsedMs: Date.now()-started });
      if (error instanceof RunError) break;
    }
    const latest = results.at(-1)!;
    console.log(JSON.stringify({ id: latest.id, passed: latest.passed, costUsd: latest.costUsd }));
  }
  await mkdir(".local", { recursive: true });
  const report = { settings: extractionSettings(), fixtureCount: fixtures.length, retiredSkipped: retiredFixtures.map(f => f.id), notRun: fixtures.length-results.length, results, costUsd: budget.spent };
  await writeFile(process.env.EVALUATION_REPORT || ".local/evaluation.json", JSON.stringify(report,null,2), { mode: 0o600 });
  console.log(`${results.filter(r => r.passed).length}/${fixtures.length} real-source cases passed; ${fixtures.length-results.length} not run; $${budget.spent.toFixed(6)}`);
  if (results.some(r => !r.passed)) process.exitCode = 1;
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
