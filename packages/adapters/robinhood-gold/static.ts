import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "robinhood-gold",
      name: "Robinhood Gold Card",
      defillamaSlug: "robinhood",
      tiers: [
        {
          id: "robinhood-gold--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
