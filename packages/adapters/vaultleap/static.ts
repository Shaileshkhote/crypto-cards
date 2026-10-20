import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "vaultleap",
      id: "vaultleap",
      name: "VaultLeap",
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
      network: "visa",
      issuer: {
        id: "lead-bank",
        name: "Lead Bank",
        country: "US",
      },
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
