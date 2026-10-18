import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "picnic",
      name: "Picnic Card",
      defillamaSlug: "picnic",
      tiers: [
        {
          id: "picnic--global--default",
          name: "Default",
          legacyRegion: "global",
        },
      ],
      inheritFields: ["cardTypes"],
      cardTypes: {
        physical: true,
        virtual: true,
      },
    },
  ],
  sourceDate: "2026-10-15",
} satisfies CardStaticData;
