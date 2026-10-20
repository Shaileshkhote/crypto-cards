import { it, expect } from "vitest";
import { matchesClaim } from "../scripts/evaluation-claims";
import { document, extraction } from "./helpers";

it("matches a labeled price on its own tier scope without mixing prices from another tier", () => {
  const e = extraction(document());
  e.facts[0].tierId = null;
  e.facts[0].value = [
    { id: "platinum", kind: "issuance", scope: { tierIds: ["platinum"] }, calculation: "fixed", fixed: { amount: "15", currency: "USD" }, calculable: true },
    { id: "signature", kind: "issuance", scope: { tierIds: ["signature"] }, calculation: "fixed", fixed: { amount: "0", currency: "USD" }, calculable: true },
  ];
  const claim = { field: "fees", productId: "card", tierId: "platinum", rule: { fixed: { amount: "15" } } };
  expect(matchesClaim(e, claim)).toBe(true);
  expect(matchesClaim(e, { ...claim, tierId: "signature" })).toBe(false);
  expect(matchesClaim(e, { ...claim, productId: "other-card" })).toBe(false);
  expect(matchesClaim(e, { ...claim, rule: { fixed: { amount: "0" } } })).toBe(false);
  e.facts[0].tierId = "signature";
  expect(matchesClaim(e, claim)).toBe(false);
  e.facts[0].tierId = "platinum";
  e.facts[0].value = [{ id: "platinum", kind: "issuance", scope: {}, calculation: "fixed", fixed: { amount: "15", currency: "USD" }, calculable: true }];
  expect(matchesClaim(e, claim)).toBe(true);
});
