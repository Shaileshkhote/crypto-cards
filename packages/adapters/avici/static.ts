import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "avici",
      name: "Avici",
      defillamaSlug: "avici",
      tiers: [
        {
          id: "avici--global--platinum",
          name: "Platinum",
          legacyRegion: "global",
        },
        {
          id: "avici--global--signature",
          name: "Signature",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
