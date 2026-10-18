import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "kraken",
      name: "Kraken Card",
      defillamaSlug: "kraken-card",
      tiers: [
        {
          id: "kraken--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
        {
          id: "kraken--eea--default",
          name: "Default",
          legacyRegion: "eea",
        },
        {
          id: "kraken--united-kingdom--default",
          name: "Default",
          legacyRegion: "united-kingdom",
        },
      ],
    },
  ],
} satisfies CardStaticData;
