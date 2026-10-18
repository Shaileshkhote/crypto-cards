import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "solayer",
      name: "Solayer",
      defillamaSlug: "solayer-card",
      tiers: [
        {
          id: "solayer--international--default",
          name: "Default",
          legacyRegion: "international",
        },
      ],
    },
  ],
} satisfies CardStaticData;
