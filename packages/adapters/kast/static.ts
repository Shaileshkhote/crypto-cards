import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "kast",
      name: "KAST",
      defillamaSlug: "kast-card",
      tiers: [
        {
          id: "kast--international--standard",
          name: "Standard",
          legacyRegion: "international",
        },
        {
          id: "kast--international--premium",
          name: "Premium",
          legacyRegion: "international",
        },
        {
          id: "kast--international--private",
          name: "Private",
          legacyRegion: "international",
        },
      ],
    },
  ],
} satisfies CardStaticData;
