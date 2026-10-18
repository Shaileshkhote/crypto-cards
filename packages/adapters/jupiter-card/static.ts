import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "jupiter-card",
      name: "Jupiter Card",
      defillamaSlug: "jupiter-aggregator",
      tiers: [
        {
          id: "jupiter-card--rain-issued--default",
          name: "Default",
          legacyRegion: "rain-issued",
        },
        {
          id: "jupiter-card--dcs-issued--default",
          name: "Default",
          legacyRegion: "dcs-issued",
        },
      ],
    },
  ],
} satisfies CardStaticData;
