import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { loadAdapters } from "@cards/core/adapters";
import { documentFromText } from "@cards/core/crawler";
import { applyChanges, candidate, markUnconfirmed, merge, preserveSourceDisagreements } from "@cards/core/merge";
import { Extraction, type ExtractionData } from "@cards/core/schema";

interface Conflict {
  provider: string;
  productId: string;
  field: "fees" | "limits" | "residentCountries";
  previousValue: unknown;
  observations: { url: string; text: string }[];
}
// These manually reviewed inputs preserve disagreements. They do not resolve
// which source is authoritative or claim a new successful model extraction.
const fixtures: Conflict[] = JSON.parse(await readFile(new URL("./fixtures/source-conflicts.json", import.meta.url), "utf8"));
const adapters = await loadAdapters();
it("preserves an article's table/body disagreement but requires same-block service collisions to be corrected", () => {
  const doc = documentFromText("https://example.com/fees", "APAC crypto conversion fee: 0%.\nAPAC crypto conversion fee: 1%.");
  const values = [0, 1].map(ratePercent => ({ id: "conversion", kind: "conversion", calculation: "percentage", ratePercent, scope: {}, calculable: true }));
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: doc.blocks.map((block, i) => ({ productId: null, tierId: null, inherit: false, field: "fees", value: [values[i]], evidence: { url: doc.url, blockId: block.id, quote: block.text } })) });
  expect(preserveSourceDisagreements(incoming).extraction.facts.map(f => f.field)).toEqual(["terms", "terms"]);
  const together = documentFromText(doc.url, "APAC crypto conversion fee: 0% or 1%.");
  const ambiguous = Extraction.parse({ ...incoming, facts: [{ ...incoming.facts[0], value: values, evidence: { url: together.url, blockId: together.blocks[0].id, quote: together.content } }] });
  expect(() => preserveSourceDisagreements(ambiguous)).toThrow("Ambiguous fees identity");
  expect(() => preserveSourceDisagreements({ ...ambiguous, facts: [...ambiguous.facts, incoming.facts[1]] })).toThrow("Ambiguous fees identity");
});
it("uses declared contractual precedence only for the matching fee and keeps the alternative quoted for review", () => {
  const fixture = fixtures.find(f => f.provider === "payitfast")!;
  const adapter = adapters.find(a => a.config.id === fixture.provider)!;
  const docs = fixture.observations.map(o => documentFromText(o.url, o.text));
  const prior = fixture.previousValue as Record<string, unknown>[];
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: docs.map((doc, i) => ({
    productId: fixture.productId, tierId: null, inherit: false, field: "fees", value: [{ ...prior[0], ratePercent: i ? 2.2 : 1 }],
    evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text },
  })) });
  const result = preserveSourceDisagreements(incoming, adapter.sources);
  expect(result.extraction.facts.filter(f => f.field === "fees")).toHaveLength(1);
  expect(result.extraction.facts.find(f => f.field === "fees")!.evidence.url).toBe("https://payitfast.com/card-terms");
  expect(result.extraction.facts.find(f => f.field === "terms")!.value).toEqual([docs[0].content]);
  const built = candidate(adapter, [result.extraction], undefined, docs).data;
  expect(built.products!.find(p => p.id === fixture.productId)!.fees![0]).toMatchObject({ ratePercent: 2.2 });
  const accepted = candidate(adapter, [{ ...incoming, facts: [incoming.facts[0]] }], undefined, docs).data;
  const merged = merge(markUnconfirmed(accepted, docs, [result.extraction], built), built);
  expect(merged.published.products!.find(p => p.id === fixture.productId)!.fees![0]).toMatchObject({ ratePercent: 1, status: "unconfirmed" });
  expect(merged.changes.some(c => c.path.includes("ratePercent"))).toBe(true);
});
it("does not hide fabricated prices as a source disagreement, and retains unrelated supported fees", () => {
  const docs = [documentFromText("https://example.com/one", "FX: 1%. ATM: 2%."), documentFromText("https://example.com/two", "FX: 3%. ATM: 2%.")];
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: docs.map((doc, i) => ({
    productId: null, tierId: null, inherit: false, field: "fees", value: [
      { id: "fx", kind: "fx", calculation: "percentage", ratePercent: i ? 3 : 1, scope: {}, calculable: true },
      { id: "atm", kind: "atm", calculation: "percentage", ratePercent: 2, scope: {}, calculable: true },
    ], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text },
  })) });
  const normalized = preserveSourceDisagreements(incoming).extraction;
  const a = adapters.find(a => a.config.id === "kast")!;
  const built = candidate({ ...a, static: {} }, [normalized], undefined, docs).data;
  expect(built.fees).toHaveLength(1);
  expect(built.fees![0]).toMatchObject({ kind: "atm", ratePercent: 2 });
  expect(built.terms).toHaveLength(2);
  (incoming.facts[0].value as { ratePercent: number }[])[0].ratePercent = 99;
  expect(() => preserveSourceDisagreements(incoming)).toThrow("Financial value 99 is absent");
});
it.each(fixtures)("converts independently cited $provider disagreements to terms before publication, retaining accepted values", fixture => {
  const adapter = adapters.find(a => a.config.id === fixture.provider)!;
  const docs = fixture.observations.map(o => documentFromText(o.url, o.text));
  const previousRule = Array.isArray(fixture.previousValue) ? fixture.previousValue[0] as Record<string, unknown> : {};
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: docs.map((doc, i) => ({
    productId: fixture.productId, tierId: null, inherit: false, field: fixture.field,
    value: fixture.field === "residentCountries" ? i ? ["KR", "JP"] : ["SG", "CN"]
      : fixture.field === "limits" ? [{ ...previousRule, amount: { amount: i ? "250" : "500", currency: "USD" } }]
      : [{ ...previousRule, ratePercent: fixture.provider === "payitfast" ? i ? 2.2 : 1 : i ? 1 : 0 }],
    evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text },
  })) });
  const { extraction, issues } = preserveSourceDisagreements(incoming);
  expect(issues).toHaveLength(1);
  expect(extraction.facts.every(f => f.field === "terms")).toBe(true);
  for (const doc of docs) expect(extraction.facts.some(f => f.evidence.url === doc.url && Array.isArray(f.value) && f.value.some(value => value === doc.blocks[0].text))).toBe(true);
  const built = candidate(adapter, [extraction], undefined, docs).data;
  expect(built.products!.find(p => p.id === fixture.productId)![fixture.field]).toBeUndefined();
  const accepted = candidate(adapter, [{ ...incoming, facts: [incoming.facts[0]] }], undefined, docs).data;
  const retained = merge(markUnconfirmed(accepted, docs, [extraction], built), built).published.products!.find(p => p.id === fixture.productId)!;
  if (fixture.field === "residentCountries") expect(retained.residentCountries).toEqual(["CN", "SG"]);
  else expect(retained[fixture.field]![0]).toMatchObject({ ...accepted.products!.find(p => p.id === fixture.productId)![fixture.field]![0], status: "unconfirmed" });
});
it.each(fixtures)("preserves both $provider source observations without choosing a new disputed value", fixture => {
  const adapter = adapters.find(a => a.config.id === fixture.provider)!;
  const docs = fixture.observations.map(o => documentFromText(o.url, o.text, o.url, [], true));
  const incoming: ExtractionData = { complete: true, products: [], tiers: [], facts: docs.map(doc => ({
    productId: fixture.productId, tierId: null, inherit: false, field: "terms", value: [doc.content],
    evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text },
  })) };
  const built = candidate(adapter, [incoming], undefined, docs).data;
  const product = built.products!.find(p => p.id === fixture.productId)!;
  for (const doc of docs) expect(product.terms).toContain(doc.content);
  expect(product.fieldSources!.terms).toHaveLength(2);
  expect(product[fixture.field]).toBeUndefined();

  // An old accepted observation is a retention fixture, not a source-priority
  // decision. Updating to narrative uncertainty must not erase its values.
  const prior = Extraction.parse({ ...incoming, facts: [{ ...incoming.facts[0], field: fixture.field, value: fixture.previousValue }] });
  const accepted = candidate(adapter, [prior], undefined, docs).data;
  const unconfirmed = markUnconfirmed(accepted, docs, [incoming], built);
  const result = merge(unconfirmed, built);
  const published = result.published.products!.find(p => p.id === fixture.productId)!;
  if (fixture.field === "residentCountries") {
    expect(published.residentCountries).toEqual(["CN", "SG"]);
    expect(published.unconfirmedFields).toContain("residentCountries");
  } else {
    const oldRule = accepted.products!.find(p => p.id === fixture.productId)![fixture.field]![0];
    expect(published[fixture.field]).toEqual([{ ...oldRule, status: "unconfirmed" }]);
  }
  // Product-level additions are held for review by the existing merge policy.
  // Both cited clauses must remain in that reviewable proposal.
  expect(result.changes.length).toBeGreaterThan(0);
  const proposed = applyChanges(result.published, result.changes).products!.find(p => p.id === fixture.productId)!;
  for (const doc of docs) expect(proposed.terms).toContain(doc.content);
});

it("preserves independent card-type disagreements while retaining the undisputed form factor", async () => {
  const { adapter: exampleAdapter } = await import('./helpers');
  const adapter = exampleAdapter();
  const docs = [documentFromText('https://example.com/card', 'Physical and virtual cards are available.'), documentFromText('https://example.com/terms', 'Virtual cards are available; physical cards are not available.')];
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: docs.map((doc, index) => ({ productId: 'card', tierId: 'core', inherit: false, field: 'cardTypes', value: { physical: index === 0, virtual: true }, evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.content } })) });
  const resolved = preserveSourceDisagreements(incoming);
  expect(resolved.extraction.facts.filter(fact => fact.field === 'terms').map(fact => fact.value)).toEqual(docs.map(doc => [doc.content]));
  const built = candidate(adapter, [resolved.extraction], undefined, docs).data;
  expect(built.products![0].tiers![0].cardTypes).toEqual({ virtual: true });
  const accepted = candidate(adapter, [{ ...incoming, facts: [incoming.facts[0]] }], undefined, docs).data;
  const retained = merge(markUnconfirmed(accepted, docs, [resolved.extraction], built), built).published.products![0].tiers![0];
  expect(retained.cardTypes).toEqual({ physical: true, virtual: true });
  expect(retained.unconfirmedFields).toContain('cardTypes');
});

it("requires same-block card-type contradictions to be corrected and combines complementary claims", async () => {
  const { adapter: exampleAdapter } = await import('./helpers');
  const doc = documentFromText('https://example.com/card', 'Physical and virtual cards are available.');
  const fact = { productId: 'card', tierId: 'core', inherit: false, field: 'cardTypes', value: { physical: true }, evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.content } };
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: [fact, { ...fact, value: { physical: false } }] });
  expect(() => preserveSourceDisagreements(incoming)).toThrow('same source block');
  const complementary = preserveSourceDisagreements(Extraction.parse({ ...incoming, facts: [fact, { ...fact, value: { virtual: true } }] })).extraction;
  expect(candidate(exampleAdapter(), [complementary], undefined, [doc]).data.products![0].tiers![0].cardTypes).toEqual({ physical: true, virtual: true });
});

it.each([
  { field: 'chains', values: [['Ethereum', 'Optimism'], ['Ethereum', 'Base']], texts: ['Supported chains: Ethereum and Optimism.', 'Supported chains: Ethereum and Base.'] },
  { field: 'network', values: ['visa', 'mastercard'], texts: ['The card uses Visa.', 'The card uses Mastercard.'] },
  { field: 'issuer', values: [{ id: 'bank-one', name: 'Bank One' }, { id: 'bank-two', name: 'Bank Two' }], texts: ['The card is issued by Bank One.', 'The card is issued by Bank Two.'] },
])('preserves independent $field claims without selecting an incompatible value', async ({ field, values, texts }) => {
  const { adapter: exampleAdapter } = await import('./helpers');
  const docs = texts.map((text, i) => documentFromText(`https://example.com/source-${i}`, text));
  const incoming = Extraction.parse({ complete: true, products: [], tiers: [], facts: docs.map((doc, i) => ({ productId: 'card', tierId: 'core', inherit: false, field, value: values[i], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.content } })) });
  const resolved = preserveSourceDisagreements(incoming);
  expect(resolved.extraction.facts.map(fact => fact.field)).toEqual(['terms', 'terms']);
  expect(resolved.extraction.facts.map(fact => fact.value)).toEqual(docs.map(doc => [doc.content]));
  const built = candidate(exampleAdapter(), [resolved.extraction], undefined, docs).data;
  expect(built.products![0].tiers![0][field as 'chains' | 'network' | 'issuer']).toBeUndefined();
});
