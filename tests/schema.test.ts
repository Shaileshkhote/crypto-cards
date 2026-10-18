import { describe, it, expect } from "vitest";
import { FeeRule, Card, Money, Scope, Extraction } from "@cards/core/schema";
import { document, extraction } from "./helpers";
describe("typed canonical schema", () => {
  it("retains a typed price for a named uncommon service without pretending it is a purchase fee", () => {
    const fee = { id: "copy", kind: "other", serviceId: "statement-copy", calculation: "fixed", fixed: { amount: "10", currency: "USD" }, scope: {}, calculable: true };
    expect(FeeRule.parse(fee)).toMatchObject({ serviceId: "statement-copy", fixed: { amount: "10" } });
    expect(FeeRule.safeParse({ ...fee, serviceId: undefined }).success).toBe(false);
    expect(FeeRule.safeParse({ ...fee, kind: "transaction" }).success).toBe(false);
  });
  it("represents observed card service fees without misclassifying their event", () => {
    const fee = { id: "fee", calculation: "fixed", fixed: { amount: "50", currency: "USD" }, calculable: true, scope: {} };
    for (const kind of ["cancellation", "chargeback", "transaction_decline", "small_transaction"])
      expect(FeeRule.parse({ ...fee, kind })).toMatchObject({ kind, calculation: "fixed" });
  });
  it("distinguishes unknown, zero, false and empty lists", () => {
    const card = Card.parse({
      id: "test",
      name: "Test",
      website: "https://example.com",
      kyc: false,
      residentCountries: null,
      excludedResidentCountries: [],
      fees: [
        {
          id: "zero",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "0", currency: "EUR" },
          scope: {},
          calculable: true,
        },
      ],
    });
    expect(card.kyc).toBe(false);
    expect(card.residentCountries).toBeNull();
    expect(card.excludedResidentCountries).toEqual([]);
    expect(card.fees?.[0].calculation).toBe("fixed");
  });
  it("rejects missing numeric calculation inputs and prose countries", () => {
    expect(Money.parse({ amount: "0.00", currency: "EUR" }).amount).toBe("0");
    expect(Money.parse({ amount: "200.5000", currency: "EUR" }).amount).toBe("200.5");
    expect(
      FeeRule.safeParse({
        id: "x",
        kind: "fx",
        calculation: "percentage",
        calculable: true,
        scope: {},
      }).success,
    ).toBe(false);
    expect(Scope.safeParse({ residentCountries: ["Europe"] }).success).toBe(
      false,
    );
    for (const region of ["EU", "EEA", "APAC", "UK"])
      expect(Scope.safeParse({ residentCountries: [region] }).success).toBe(false);
    expect(Scope.parse({ residentCountries: ["GB"], regions: ["EEA"] })).toEqual({
      residentCountries: ["GB"], regions: ["EEA"],
    });
    expect(Money.safeParse({ amount: 1, currency: "USD" }).success).toBe(false);
  });
  it("validates tiered inclusion, thresholds, currency, period and behavior", () => {
    const rule = {
      id: "atm",
      kind: "atm",
      calculation: "tiered",
      scope: {},
      calculable: true,
      period: "month",
      mode: "marginal",
      brackets: [
        {
          upperBound: { amount: "200", currency: "EUR" },
          inclusive: true,
          ratePercent: 0,
        },
        { upperBound: null, inclusive: false, ratePercent: 2 },
      ],
    };
    expect(FeeRule.safeParse(rule).success).toBe(true);
    expect(FeeRule.safeParse({ ...rule, mode: undefined }).success).toBe(false);
    expect(
      FeeRule.safeParse({
        ...rule,
        brackets: [
          { upperBound: null, inclusive: true, ratePercent: 0 },
          ...rule.brackets,
        ],
      }).success,
    ).toBe(false);
  });
  it("validates source-backed fixture candidates", () => {
    expect(Extraction.safeParse(extraction(document())).success).toBe(true);
  });
});
