import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "metamask",
      name: "MetaMask",
      defillamaSlug: "metamask-card",
      tiers: [
        {
          id: "metamask--global--default",
          name: "Default",
          legacyRegion: "global",
        },
        {
          id: "metamask--global--metal",
          name: "Metal",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
