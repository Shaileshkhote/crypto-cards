import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "redotpay",
      name: "RedotPay",
      defillamaSlug: "redotpay-card",
      tiers: [
        {
          id: "redotpay--global--hkd-card",
          name: "HKD card",
          legacyRegion: "global",
        },
        {
          id: "redotpay--global--usd-card",
          name: "USD card",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
