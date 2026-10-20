import type { CardConfig } from "@cards/core/schema";

export default {
  id: "vaultleap",
  name: "VaultLeap",
  website: "https://vaultleap.com",
  discovery: false,
  products: [
    {
      id: "vaultleap",
      name: "VaultLeap",
      defillamaSlug: "vaultleap",
    },
  ],
  tiers: [
    {
      id: "vaultleap--global--standard",
      productId: "vaultleap",
      name: "Standard",
      legacyRegion: "global",
    },
    {
      id: "vaultleap--global--pro",
      productId: "vaultleap",
      name: "Pro",
      legacyRegion: "global",
    },
    {
      id: "vaultleap--global--zero",
      productId: "vaultleap",
      name: "Zero",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
