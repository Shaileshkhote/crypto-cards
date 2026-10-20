import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "bitget-wallet-card",
      id: "bitget-wallet",
      name: "Bitget Wallet",
      tiers: [
        {
          id: "bitget-wallet--asia-pacific--physical-card",
          name: "Physical card",
          legacyRegion: "asia-pacific",
          network: "visa",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
