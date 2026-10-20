import type { CardConfig } from "@cards/core/schema";

export default {
  id: "tuyo",
  name: "Tuyo",
  website: "https://help.tuyo.com",
  discovery: false,
  products: [
    {
      id: "tuyo",
      name: "Tuyo",
      defillamaSlug: "tuyo-card",
    },
  ],
  tiers: [
    {
      id: "tuyo--global--default",
      productId: "tuyo",
      name: "Default",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
