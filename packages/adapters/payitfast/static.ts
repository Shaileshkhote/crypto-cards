import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "payitfast",
      name: "PayitFast Card",
      defillamaSlug: "payitfast",
      tiers: [
        {
          id: "payitfast--global--standard",
          name: "Standard",
          legacyRegion: "global",
        },
        {
          id: "payitfast--global--elite",
          name: "Elite",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
