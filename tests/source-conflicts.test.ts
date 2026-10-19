import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { loadAdapters } from "@cards/core/adapters";
import { documentFromText } from "@cards/core/crawler";
import { applyChanges, candidate, markUnconfirmed, merge } from "@cards/core/merge";
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
