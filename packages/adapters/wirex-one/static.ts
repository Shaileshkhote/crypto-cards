import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "wirex-one",
      name: "Wirex One",
      defillamaSlug: "wirex-one",
      tiers: [
        {
          id: "wirex-one--global--base",
          name: "Base",
          legacyRegion: "global",
        },
        {
          id: "wirex-one--global--premium",
          name: "Premium",
          legacyRegion: "global",
        },
        {
          id: "wirex-one--global--elite",
          name: "Elite",
          legacyRegion: "global",
        },
        {
          id: "wirex-one--global--private",
          name: "Private",
          legacyRegion: "global",
        },
        {
          id: "wirex-one--global--bespoke",
          name: "Bespoke",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
