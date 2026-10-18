import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "phantom-cash",
      name: "Phantom Cash",
      defillamaSlug: "phantom",
      tiers: [
        {
          id: "phantom-cash--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
