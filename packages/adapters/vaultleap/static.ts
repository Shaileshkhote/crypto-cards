import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "vaultleap",
      name: "VaultLeap",
      defillamaSlug: "vaultleap",
      tiers: [
        {
          id: "vaultleap--global--standard",
          name: "Standard",
          legacyRegion: "global",
        },
        {
          id: "vaultleap--global--pro",
          name: "Pro",
          legacyRegion: "global",
        },
        {
          id: "vaultleap--global--zero",
          name: "Zero",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
