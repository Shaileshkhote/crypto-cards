import type { CardConfig } from "@cards/core/schema";

export default {
  id: "ethena-pay",
  name: "Ethena Pay",
  website: "https://pay.ethena.fi",
  discovery: false,
  products: [
    {
      id: "ethena-pay",
      name: "Ethena Pay",
      defillamaSlug: "ethena-pay",
    },
  ],
  tiers: [
    {
      id: "ethena-pay--international--standard",
      productId: "ethena-pay",
      name: "Standard",
      legacyRegion: "international",
    },
    {
      id: "ethena-pay--international--pro",
      productId: "ethena-pay",
      name: "Pro",
      legacyRegion: "international",
    },
    {
      id: "ethena-pay--international--vip",
      productId: "ethena-pay",
      name: "VIP",
      legacyRegion: "international",
    },
  ],
  aliases: {},
} satisfies CardConfig;
