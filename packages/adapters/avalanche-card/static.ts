import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "avalanche-card",
      name: "Avalanche Card",
      defillamaSlug: "avalanche-card",
      tiers: [
        {
          id: "avalanche-card--international--default",
          name: "Default",
          legacyRegion: "international",
        },
        {
          id: "avalanche-card--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
