import type { CardConfig } from "@cards/core/schema";

export default {
  id: "avici",
  name: "Avici",
  website: "https://avici.money",
  discovery: false,
  products: [
    {
      id: "avici",
      name: "Avici",
      defillamaSlug: "avici",
    },
  ],
  tiers: [
    {
      id: "avici--global--platinum",
      productId: "avici",
      name: "Platinum",
      legacyRegion: "global",
    },
    {
      id: "avici--global--signature",
      productId: "avici",
      name: "Signature",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
