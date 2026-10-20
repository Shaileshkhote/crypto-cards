import type { CardConfig } from "@cards/core/schema";

export default {
  id: "exa",
  name: "Exa",
  website: "https://www.exactly.app",
  discovery: false,
  products: [
    {
      id: "exa",
      name: "Exa",
      defillamaSlug: "exa-card",
    },
  ],
  tiers: [
    {
      id: "exa--international--default",
      productId: "exa",
      name: "Default",
      legacyRegion: "international",
    },
    {
      id: "exa--united-states--default",
      productId: "exa",
      name: "Default",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
