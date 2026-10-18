import type { CardConfig } from "@cards/core/schema";

export default {
  id: "kast",
  name: "KAST",
  website: "https://www.kast.xyz",
  discovery: false,
  products: [
    {
      id: "kast",
      name: "KAST",
      defillamaSlug: "kast-card",
    },
  ],
  tiers: [
    {
      id: "kast--international--standard",
      productId: "kast",
      name: "Standard",
      legacyRegion: "international",
    },
    {
      id: "kast--international--premium",
      productId: "kast",
      name: "Premium",
      legacyRegion: "international",
    },
    {
      id: "kast--international--private",
      productId: "kast",
      name: "Private",
      legacyRegion: "international",
    },
  ],
  aliases: {},
} satisfies CardConfig;
