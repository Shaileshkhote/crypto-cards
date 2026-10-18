import { describe, it, expect } from "vitest";
import {
  candidate,
  merge,
  applyChanges,
  publicationHash,
} from "@cards/core/merge";
import { canonical } from "@cards/core/serialize";
import { adapter, document, extraction } from "./helpers";
import { Card } from "@cards/core/schema";
describe("deterministic merge and protection", () => {
  it("keeps lifecycle and retirement metadata owned by adapter configuration", () => {
    const a = adapter(), doc = document(), e = extraction(doc);
    a.config.products[0].lifecycle = "retired";
    a.config.products[0].retiredAt = "2026-08-29";
    a.config.tiers[0].lifecycle = "retired";
    a.config.tiers[0].retiredAt = "2026-08-29";
    e.products = [{ id: "card", name: "Card", lifecycle: "active", retiredAt: null }];
    e.tiers = [{ id: "core", name: "Core", productId: "card", lifecycle: "active", retiredAt: null }];
    const product = candidate(a, [e], undefined, [doc]).data.products![0];
    expect(product).toMatchObject({ lifecycle: "retired", retiredAt: "2026-08-29" });
    expect(product.tiers?.find(t => t.id === "core")).toMatchObject({ lifecycle: "retired", retiredAt: "2026-08-29" });
  });
  it("produces byte-identical data for the same accepted snapshot", () => {
    const a = adapter(),
      doc = document(),
      e = extraction(doc);
    const first = candidate(a, [e], undefined, [doc]).data;
    const again = candidate(a, [e], first, [doc]).data;
    expect(canonical(merge(first, again).published)).toBe(canonical(first));
    expect(publicationHash(again)).toBe(publicationHash(first));
  });
  it("holds financial edits and applies only the reviewed path", () => {
    const a = adapter(),
      old = document(),
      next = document(2);
    const accepted = candidate(a, [extraction(old)], undefined, [old]).data;
    const incoming = candidate(a, [extraction(next, 2)], accepted, [next]).data;
    const result = merge(accepted, incoming);
    expect(canonical(result.published)).toBe(canonical(accepted));
    expect(result.changes.some((c) => c.path.at(-1) === "ratePercent")).toBe(
      true,
    );
    const approved = applyChanges(result.published, result.changes);
    expect(approved.products?.[0].tiers?.[0].fees?.[0]).toMatchObject({
      ratePercent: 2,
    });
    expect(approved.products?.[0].tiers?.[1]).toEqual(
      accepted.products?.[0].tiers?.[1],
    );
  });
  it("preserves unrelated rules on a partial source result", () => {
    const accepted = Card.parse({
      id: "example",
      name: "Example",
      website: "https://example.com",
      fees: [
        {
          id: "monthly",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "10", currency: "EUR" },
          scope: {},
          calculable: true,
        },
      ],
    });
    expect(
      merge(accepted, {
        id: "example",
        name: "Example",
        website: "https://example.com",
      }).published,
    ).toEqual(accepted);
  });
  it("gives explicit static zero and false precedence and queues subsequent edits", () => {
    const a = adapter(),
      doc = document();
    a.static = {
      kyc: false,
      fees: [
        {
          id: "static-fee",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "0", currency: "EUR" },
          scope: {},
          calculable: true,
        },
      ],
    };
    const data = candidate(a, [], undefined, []).data;
    expect(data.kyc).toBe(false);
    expect(data.fees?.[0]).toMatchObject({
      fixed: { amount: "0" },
      source: { origin: "static" },
    });
    a.static.kyc = true;
    expect(merge(data, candidate(a, [], data, [doc]).data).published.kyc).toBe(
      false,
    );
  });
  it("treats explicit empty fee lists as removals requiring review", () => {
    const a = adapter();
    a.static = {
      fees: [
        {
          id: "monthly",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "0", currency: "USD" },
          scope: {},
          calculable: true,
        },
      ],
    };
    const old = candidate(a, []).data;
    a.static.fees = [];
    const r = merge(old, candidate(a, []).data);
    expect(r.changes.length).toBeGreaterThan(0);
    expect(r.published.fees).toHaveLength(1);
    expect(applyChanges(r.published, r.changes).fees).toEqual([]);
  });
  it("rejects bogus citations and incomplete results", () => {
    const a = adapter(),
      doc = document(),
      e = extraction(doc);
    e.facts[0].evidence.quote = "made up";
    expect(() => candidate(a, [e], undefined, [doc])).toThrow(
      "Invalid evidence",
    );
    e.complete = false;
    expect(() => candidate(a, [e])).toThrow("Incomplete");
  });
});
it("does not depend on extraction grouping or fact order across documents", () => {
  const a = adapter(),
    one = document(),
    two = { ...document(), url: "https://example.com/second" };
  const e1 = extraction(one),
    e2 = extraction(two);
  e2.facts[0].evidence.url = two.url;
  const grouped = {
    complete: true,
    products: [],
    tiers: [],
    facts: [...e2.facts, ...e1.facts],
  };
  expect(canonical(candidate(a, [grouped], undefined, [one, two]).data)).toBe(
    canonical(candidate(a, [e1, e2], undefined, [one, two]).data),
  );
});
it("refuses conflicting interpretations from two valid source quotes", () => {
  const a = adapter(),
    one = document(),
    two = { ...document(2), url: "https://example.com/second" },
    e1 = extraction(one),
    e2 = extraction(two, 2);
  e2.facts[0].evidence.url = two.url;
  expect(() => candidate(a, [e1, e2], undefined, [one, two])).toThrow(
    "Conflicting extracted facts",
  );
});
it("gives daily and monthly limits separate identities without value-based IDs", () => {
  const a = adapter(),
    doc = document(),
    e = extraction(doc);
  e.facts[0].field = "limits";
  e.facts[0].value = [
    {
      id: "one",
      kind: "spending",
      amount: { amount: "100", currency: "USD" },
      period: "day",
      scope: {},
      calculable: true,
    },
    {
      id: "two",
      kind: "spending",
      amount: { amount: "1000", currency: "USD" },
      period: "month",
      scope: {},
      calculable: true,
    },
  ];
  const out = candidate(a, [e], undefined, [doc]).data;
  expect(
    new Set(out.products?.[0].tiers?.[0].limits?.map((x) => x.id)).size,
  ).toBe(2);
});
it("keeps actual card services as separate charges rather than generic transactions", () => {
  const a = adapter(), doc = document(), e = extraction(doc);
  e.facts[0].value = (["atm", "atm_decline", "atm_balance_inquiry", "cross_border", "late_payment", "returned_payment", "delivery"] as const).map(kind => ({
    id: kind, kind,
    calculation: "fixed" as const, fixed: { amount: "0.6", currency: "USD" },
    scope: {}, calculable: true as const,
  }));
  const fees = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!;
  expect(new Set(fees.map(f => f.id)).size).toBe(7);
});
it("distinguishes per-purchase, daily-money and daily-count limits", () => {
  const a = adapter(), doc = document(), e = extraction(doc);
  e.facts[0].field = "limits";
  e.facts[0].value = [
    { id: "purchase", kind: "spending", amount: { amount: "80000", currency: "USD" }, period: "transaction", scope: {}, calculable: true },
    { id: "daily", kind: "spending", amount: { amount: "1000000", currency: "USD" }, period: "day", scope: {}, calculable: true },
    { id: "count", kind: "transaction_count", count: 50, period: "day", scope: {}, calculable: true },
  ];
  const limits = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].limits!;
  expect(new Set(limits.map(l => l.id)).size).toBe(3);
  expect(limits.find(l => l.kind === "transaction_count")).toMatchObject({ count: 50 });
  expect(limits.find(l => l.kind === "transaction_count")).not.toHaveProperty("amount");
});
it("replaces extracted provenance and fee variants with explicit static values through review", () => {
  const a = adapter(),
    doc = document();
  const accepted = candidate(a, [extraction(doc)], undefined, [doc]).data;
  a.static = {
    products: [
      {
        id: "card",
        name: "Card",
        tiers: [
          {
            id: "core",
            name: "Core",
            fees: [
              {
                id: "manual",
                kind: "fx",
                calculation: "fixed",
                fixed: { amount: "0", currency: "USD" },
                scope: { residentCountries: ["DE"] },
                calculable: true,
              },
            ],
          },
        ],
      },
    ],
  };
  const built = candidate(a, [extraction(doc)], accepted, [doc]).data;
  const proposed = merge(accepted, built);
  expect(proposed.published).toEqual(accepted);
  const approved = applyChanges(proposed.published, proposed.changes);
  const rule = approved.products?.[0].tiers?.[0].fees?.[0];
  expect(rule).toMatchObject({
    calculation: "fixed",
    fixed: { amount: "0", currency: "USD" },
    source: { origin: "static" },
  });
  expect(rule).not.toHaveProperty("ratePercent");
  expect(rule?.source).not.toHaveProperty("quote");
  expect(approved.products?.[0].tiers?.[0].fieldSources?.fees).toEqual({
    origin: "static",
  });
});
