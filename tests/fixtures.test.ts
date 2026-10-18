import { it, expect } from "vitest";
import scenarios from "./fixtures/scenarios.json";
import { documentFromText, verifyEvidence } from "@cards/core/crawler";
import { FeeRule, RewardRule, Tier } from "@cards/core/schema";
it.each(scenarios)(
  "checks hand-labeled synthetic case $id against numeric schema and evidence",
  (scenario) => {
    const doc = documentFromText(
      `https://example.com/${scenario.id}`,
      scenario.text,
    );
    const source = {
      url: doc.url,
      blockId: doc.blocks[0].id,
      quote: scenario.text,
    };
    expect(verifyEvidence(source, [doc])).toBe(true);
    const base = { id: scenario.id, scope: {}, source };
    if (scenario.id === "regional") {
      const fee = FeeRule.parse({
        ...base,
        scope: { residentCountries: scenario.countries },
        kind: "fx",
        calculation: "percentage",
        ratePercent: scenario.ratePercent,
        calculable: true,
      });
      expect(fee).toMatchObject({
        ratePercent: 1.5,
        scope: { residentCountries: ["DE"] },
      });
    }
    if (scenario.id === "zero") {
      const fee = FeeRule.parse({
        ...base,
        kind: "monthly",
        calculation: "fixed",
        fixed: { amount: scenario.amount, currency: scenario.currency },
        calculable: true,
      });
      expect(fee).toMatchObject({ fixed: { amount: "0", currency: "EUR" } });
    }
    if (scenario.id === "tiered") {
      const fee = FeeRule.parse({
        ...base,
        kind: "atm",
        calculation: "tiered",
        mode: "marginal",
        period: "month",
        brackets: [
          {
            upperBound: { amount: "200", currency: "EUR" },
            inclusive: true,
            ratePercent: 0,
          },
          { upperBound: null, inclusive: false, ratePercent: 2 },
        ],
        calculable: true,
      });
      expect(fee).toMatchObject({ mode: "marginal", period: "month" });
    }
    if (scenario.id === "rewards") {
      const reward = RewardRule.parse({
        ...base,
        ratePercent: scenario.ratePercent,
        rewardAsset: "USDC",
        cap: {
          amount: { amount: scenario.cap, currency: "USD" },
          period: "month",
        },
        requirements: ["Excludes cash withdrawals"],
        calculable: true,
      });
      expect(reward.cap?.amount.amount).toBe("50");
    }
    if (scenario.id === "unknown") {
      const fee = FeeRule.parse({
        ...base,
        kind: "atm",
        calculation: "unknown",
        calculable: false,
        description: scenario.text,
      });
      expect(fee.calculable).toBe(false);
      expect("ratePercent" in fee).toBe(false);
    }
    if (scenario.id === "tiers") {
      expect(
        Tier.parse({
          id: "core",
          name: "Core",
          cardTypes: { virtual: true, physical: false },
        }).cardTypes?.physical,
      ).toBe(false);
      expect(
        Tier.parse({
          id: "luxe",
          name: "Luxe",
          cardTypes: { virtual: true, physical: true },
        }).cardTypes?.physical,
      ).toBe(true);
    }
  },
);
