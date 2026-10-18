import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "bitget-wallet",
      name: "Bitget Wallet",
      defillamaSlug: "bitget-wallet-card",
      tiers: [
        {
          id: "bitget-wallet--asia-pacific--physical-card",
          name: "Physical card",
          legacyRegion: "asia-pacific",
        },
      ],
    },
  ],
} satisfies CardStaticData;
