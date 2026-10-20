import type { CardConfig } from "@cards/core/schema";

export default {
  id: "avalanche-card",
  name: "Avalanche Card",
  website: "https://www.avalanchecard.com",
  discovery: false,
  products: [
    {
      id: "avalanche-card",
      name: "Avalanche Card",
      defillamaSlug: "avalanche-card",
    },
  ],
  tiers: [
    {
      id: "avalanche-card--international--default",
      productId: "avalanche-card",
      name: "Default",
      legacyRegion: "international",
    },
    {
      id: "avalanche-card--united-states--default",
      productId: "avalanche-card",
      name: "Default",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
