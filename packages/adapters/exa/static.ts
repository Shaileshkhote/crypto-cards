import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "exa",
      name: "Exa",
      defillamaSlug: "exa-card",
      tiers: [
        {
          id: "exa--international--default",
          name: "Default",
          legacyRegion: "international",
        },
        {
          id: "exa--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
