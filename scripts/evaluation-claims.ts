import type { ExtractionData } from "@cards/core/schema";

export interface Claim { field: string; productId?: string; tierId?: string; value?: unknown; rule?: unknown }

function contains(value: unknown, expected: unknown): boolean {
  if (Array.isArray(expected))
    return Array.isArray(value) && expected.every(e => value.some(v => contains(v, e)));
  if (expected && typeof expected === "object")
    return !!value && typeof value === "object" && Object.entries(expected).every(([k,v]) => contains((value as Record<string, unknown>)[k], v));
  return value === expected;
}

export function matchesClaim(extraction: ExtractionData, claim: Claim): boolean {
  return extraction.facts.some(fact => {
    if (fact.field !== claim.field || claim.productId !== undefined && fact.productId !== claim.productId || claim.value !== undefined && !contains(fact.value, claim.value)) return false;
    const tierMatches = (rule?: unknown) => {
      if (claim.tierId === undefined) return true;
      if (fact.tierId !== null && fact.tierId !== claim.tierId) return false;
      const tiers = rule && typeof rule === "object" ? (rule as { scope?: { tierIds?: unknown } }).scope?.tierIds : undefined;
      return Array.isArray(tiers) && tiers.length ? tiers.includes(claim.tierId) : fact.tierId === claim.tierId;
    };
    if (claim.rule !== undefined)
      return Array.isArray(fact.value) && fact.value.some(rule => tierMatches(rule) && contains(rule, claim.rule));
    return tierMatches();
  });
}
