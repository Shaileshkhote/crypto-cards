import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "karta",
      name: "Karta",
      defillamaSlug: "karta-card",
      tiers: [
        {
          id: "karta--international--default",
          name: "Default",
          legacyRegion: "international",
        },
        {
          id: "karta--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
