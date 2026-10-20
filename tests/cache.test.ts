import { describe, it, expect } from "vitest";
import { Card } from "@cards/core/schema";
import { directory, sortFees, filterDirectory, applicable } from "@cards/core/cache";
import { REGIONS } from "@cards/core/regions";
describe("directory scope and sorting", () => {
  it("keeps prices with unevaluated source conditions out of numeric sorting", () => {
    expect(applicable({ conditions: ["Plastic Companion Cards"] }, { country: "US", currency: "USD" })).toBe(false);
    const cards = [
      { id: "a", ratePercent: 5, scope: {} },
      { id: "z", ratePercent: 0, scope: { conditions: ["First 30 days"] } },
    ].map(({ id, ratePercent, scope }) => Card.parse({ id, name: id, website: "https://example.com", fees: [{ id: "fx", kind: "fx", calculation: "percentage", ratePercent, scope, calculable: true }] }));
    expect(sortFees(directory(cards), "fx", { country: "US", currency: "USD" }).map(row => row.providerId)).toEqual(["a", "z"]);
  });
  it("does not compare prices for unrelated uncommon services", () => {
    const cards = [
      { id: "z", serviceId: "account-letter", amount: "1" },
      { id: "a", serviceId: "statement-copy", amount: "10" },
    ].map(({ id, serviceId, amount }) => Card.parse({ id, name: id, website: "https://example.com", fees: [{ id: "fee", kind: "other", serviceId, calculation: "fixed", fixed: { amount, currency: "USD" }, scope: {}, calculable: true }] }));
    expect(sortFees(directory(cards), "other", { country: "US", currency: "USD" }, "fixed").map(row => row.providerId)).toEqual(["a", "z"]);
  });
  it("applies weekday and weekend rates only with an explicit matching day", () => {
    const scope = { daysOfWeek: ["sat" as const, "sun" as const] };
    expect(applicable(scope, {})).toBe(false);
    expect(applicable(scope, { dayOfWeek: "mon" })).toBe(false);
    expect(applicable(scope, { dayOfWeek: "sat" })).toBe(true);
  });
  it("requires the real card/issuance/payment-rail context before applying a scoped fee", () => {
    const scope = { cardTypes: ["virtual" as const], cardOrder: "additional" as const, paymentRails: ["ach"] };
    expect(applicable(scope, {})).toBe(false);
    expect(applicable(scope, { cardType: "physical", cardOrder: "additional", paymentRail: "ach" })).toBe(false);
    expect(applicable(scope, { cardType: "virtual", cardOrder: "first", paymentRail: "ach" })).toBe(false);
    expect(applicable(scope, { cardType: "virtual", cardOrder: "additional", paymentRail: "wire" })).toBe(false);
    expect(applicable(scope, { cardType: "virtual", cardOrder: "additional", paymentRail: "ach" })).toBe(true);
  });
  const card = Card.parse({
    id: "example",
    name: "Example",
    website: "https://example.com",
    network: "visa",
    products: [
      {
        id: "card",
        name: "Card",
        tiers: [
          {
            id: "core",
            name: "Core",
            network: "mastercard",
            residentCountries: ["DE"],
            cardTypes: { physical: false, virtual: true },
            fees: [
              {
                id: "de",
                kind: "fx",
                calculation: "percentage",
                ratePercent: 1,
                scope: { residentCountries: ["DE"] },
                calculable: true,
              },
              {
                id: "gb",
                kind: "fx",
                calculation: "percentage",
                ratePercent: 5,
                scope: { residentCountries: ["GB"] },
                calculable: true,
              },
            ],
          },
          {
            id: "luxe",
            name: "Luxe",
            fees: [
              {
                id: "fx",
                kind: "fx",
                calculation: "percentage",
                ratePercent: 2,
                scope: {},
                calculable: true,
              },
            ],
          },
          { id: "unknown", name: "Unknown" },
        ],
      },
    ],
  });
  it("retains tiers and multiple regional rules; does not silently inherit", () => {
    const rows = directory([card]);
    expect(rows).toHaveLength(3);
    expect(rows[0].fees).toHaveLength(2);
    expect(rows[2].facts.network).toBeUndefined();
    expect(rows[2].providerDefaults.network).toBe("visa");
  });
  it("sorts only applicable fees; unknown is last", () => {
    const rows = directory([card]);
    expect(
      sortFees(rows, "fx", { country: "DE", currency: "EUR" }).map(
        (x) => x.tierId,
      ),
    ).toEqual(["core", "luxe", "unknown"]);
    expect(
      sortFees(rows, "fx", { country: "GB", currency: "GBP" }).map(
        (x) => x.tierId,
      ),
    ).toEqual(["luxe", "core", "unknown"]);
  });
  it("filters explicit eligibility and keeps EU/EEA distinct", () => {
    expect(
      filterDirectory(directory([card]), {
        country: "DE",
        cardType: "virtual",
      }),
    ).toHaveLength(1);
    expect(REGIONS.EU).not.toContain("NO");
    expect(REGIONS.EEA).toContain("NO");
  });
  it("does not compare unlike money currencies", () => {
    const x = Card.parse({
      ...card,
      products: undefined,
      fees: [
        {
          id: "fee",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "5", currency: "USD" },
          scope: {},
          calculable: true,
        },
      ],
    });
    const row = directory([x])[0];
    expect(
      sortFees([row], "monthly", { country: "DE", currency: "EUR" }, "fixed"),
    ).toEqual([row]);
  });
});
it("inherits only explicitly declared defaults and permits leaf overrides", () => {
  const card = Card.parse({
    id: "scope",
    name: "Scope",
    website: "https://example.com",
    network: "visa",
    kyc: true,
    inheritFields: ["network"],
    products: [
      {
        id: "p",
        name: "P",
        tiers: [
          { id: "a", name: "A" },
          { id: "b", name: "B", network: "mastercard" },
        ],
      },
    ],
  });
  const rows = directory([card]);
  expect(rows[0].facts.network).toBe("visa");
  expect(rows[0].facts.kyc).toBeUndefined();
  expect(rows[1].facts.network).toBe("mastercard");
});
