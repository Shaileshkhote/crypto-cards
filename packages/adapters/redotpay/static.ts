import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "redotpay-card",
      id: "redotpay",
      name: "RedotPay",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "redotpay--global--hkd-card",
          name: "HKD card",
          legacyRegion: "global",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "redotpay--global--usd-card",
          name: "USD card",
          legacyRegion: "global",
          cardTypes: {
            physical: true,
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
