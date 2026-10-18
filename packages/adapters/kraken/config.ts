import type { CardConfig } from "@cards/core/schema";

export default {
  id: "kraken",
  name: "Kraken Card",
  website: "https://krak.app",
  discovery: false,
  products: [
    {
      id: "kraken",
      name: "Kraken Card",
      defillamaSlug: "kraken-card",
    },
  ],
  tiers: [
    {
      id: "kraken--united-states--default",
      productId: "kraken",
      name: "Default",
      legacyRegion: "united-states",
    },
    {
      id: "kraken--eea--default",
      productId: "kraken",
      name: "Default",
      legacyRegion: "eea",
    },
    {
      id: "kraken--united-kingdom--default",
      productId: "kraken",
      name: "Default",
      legacyRegion: "united-kingdom",
    },
  ],
  aliases: {
    "Krak Card": "kraken--united-kingdom--default",
    "Kraken Card": "kraken--united-kingdom--default",
  },
} satisfies CardConfig;
