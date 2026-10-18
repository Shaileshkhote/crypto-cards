import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "tuyo",
      name: "Tuyo",
      defillamaSlug: "tuyo-card",
      tiers: [
        {
          id: "tuyo--global--default",
          name: "Default",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
