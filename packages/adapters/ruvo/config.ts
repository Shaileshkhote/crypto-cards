import type { CardConfig } from "@cards/core/schema";

export default {
  id: "ruvo",
  name: "Ruvo Card",
  website: "https://ruvo.com",
  discovery: false,
  products: [
    {
      id: "ruvo",
      name: "Ruvo Card",
      defillamaSlug: "ruvo",
    },
  ],
  tiers: [
    {
      id: "ruvo--global--default",
      productId: "ruvo",
      name: "Default",
      legacyRegion: "global",
    },
  ],
  aliases: {
    "Ruvo Card": "ruvo--global--default",
  },
} satisfies CardConfig;
