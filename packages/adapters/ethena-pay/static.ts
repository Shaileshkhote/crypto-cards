import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "ethena-pay",
      name: "Ethena Pay",
      defillamaSlug: "ethena-pay",
      tiers: [
        {
          id: "ethena-pay--international--standard",
          name: "Standard",
          legacyRegion: "international",
        },
        {
          id: "ethena-pay--international--pro",
          name: "Pro",
          legacyRegion: "international",
        },
        {
          id: "ethena-pay--international--vip",
          name: "VIP",
          legacyRegion: "international",
        },
      ],
    },
  ],
} satisfies CardStaticData;
