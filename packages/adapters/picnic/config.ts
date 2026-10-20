import type { CardConfig } from "@cards/core/schema";

export default {
  id: "picnic",
  name: "Picnic Card",
  website: "https://help.usepicnic.com",
  discovery: false,
  products: [
    {
      id: "picnic",
      name: "Picnic Card",
      defillamaSlug: "picnic",
    },
  ],
  tiers: [
    {
      id: "picnic--global--default",
      productId: "picnic",
      name: "Default",
      legacyRegion: "global",
    },
  ],
  aliases: {
    "Picnic Card": "picnic--global--default",
  },
} satisfies CardConfig;
