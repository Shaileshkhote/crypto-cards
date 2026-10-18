import type { CardConfig } from "@cards/core/schema";

export default {
  id: "solayer",
  name: "Solayer",
  website: "https://docs.solayer.org",
  discovery: false,
  products: [
    {
      id: "solayer",
      name: "Solayer",
      defillamaSlug: "solayer-card",
    },
  ],
  tiers: [
    {
      id: "solayer--international--default",
      productId: "solayer",
      name: "Default",
      legacyRegion: "international",
    },
  ],
  aliases: {},
} satisfies CardConfig;
