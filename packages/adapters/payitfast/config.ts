import type { CardConfig } from "@cards/core/schema";

export default {
  id: "payitfast",
  name: "PayitFast Card",
  website: "https://payitfast.com",
  discovery: false,
  products: [
    {
      id: "payitfast",
      name: "PayitFast Card",
      defillamaSlug: "payitfast",
    },
  ],
  tiers: [
    {
      id: "payitfast--global--standard",
      productId: "payitfast",
      name: "Standard",
      legacyRegion: "global",
    },
    {
      id: "payitfast--global--elite",
      productId: "payitfast",
      name: "Elite",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
