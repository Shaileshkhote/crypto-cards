import { readFile } from "node:fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import { loadAdapters } from "@cards/core/adapters";
import { Budget, extract, modelName } from "@cards/core/agent";
import { documentFromText } from "@cards/core/crawler";
import { candidate } from "@cards/core/merge";
import { canonical } from "@cards/core/serialize";
import type { CardData } from "@cards/core/schema";

interface Regression {
  id: string;
  provider: string;
  url: string;
  text: string;
  field: "fees" | "rewards";
  productId: string;
  tierId: string | null;
  rules: Record<string, unknown>[];
}
// These are manually reviewed representation fixtures from saved live sources,
// not fresh model outputs or a provider-wide accuracy benchmark.
const fixtures: Regression[] = JSON.parse(await readFile(new URL("./fixtures/card-regressions.json", import.meta.url), "utf8"));
const adapters = await loadAdapters();
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const rulesIn = (card: CardData): { id: string }[] => {
  const visit = (value: unknown): { id: string }[] => {
    if (!value || typeof value !== "object") return [];
    const node = value as Record<string, unknown>;
    return Object.entries(node).flatMap(([key, item]) =>
      ["fees", "rewards"].includes(key) ? item as { id: string }[] :
      ["products", "tiers"].includes(key) ? (item as unknown[]).flatMap(visit) : []);
  };
  return visit(card);
};
it.each(fixtures)("retains the sourced rules for $id", async fixture => {
  const adapter = adapters.find(a => a.config.id === fixture.provider)!;
  const doc = documentFromText(fixture.url, fixture.text, fixture.url, [], true);
  const wire = { complete: true, products: [], tiers: [], facts: [{
    productId: fixture.productId, tierId: fixture.tierId, field: fixture.field,
    value: fixture.rules, evidence: { url: fixture.url, blockId: "p1b1" },
  }] };
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    if (input.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (!input.endsWith("/chat/completions")) throw new Error("Unexpected offline request");
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] });
  }));
  const budget = new Budget(0);
  const result = await extract(adapter, [doc], budget);
  expect(budget.requests).toBe(1);
  const built = candidate(adapter, [result.extraction], undefined, [doc]).data;
  const rules = rulesIn(built);
  expect(rules).toHaveLength(fixture.rules.length);
  expect(new Set(rules.map(r => r.id)).size).toBe(rules.length);
  const reversed = structuredClone(result.extraction);
  (reversed.facts[0].value as unknown[]).reverse();
  expect(canonical(candidate(adapter, [reversed], undefined, [doc]).data)).toBe(canonical(built));
  if (["karta-material-and-cash-advance", "ethena-spending-bands", "kolo-card-and-asset-conversion", "kraken-distinct-reward-programs"].includes(fixture.id)) {
    const ambiguous = structuredClone(result.extraction);
    for (const rule of ambiguous.facts[0].value as Record<string, unknown>[]) {
      delete (rule.scope as Record<string, unknown>).conditions;
      if (fixture.field === "rewards") delete rule.kind;
    }
    expect(() => candidate(adapter, [ambiguous], undefined, [doc])).toThrow("conflicting rules share a scope");
  }
});
