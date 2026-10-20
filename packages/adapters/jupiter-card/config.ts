import type { CardConfig } from "@cards/core/schema";

export default {
  id: "jupiter-card",
  name: "Jupiter Card",
  website: "https://docs.jup.ag",
  discovery: false,
  products: [
    {
      id: "jupiter-card",
      name: "Jupiter Card",
      defillamaSlug: "jupiter-aggregator",
    },
  ],
  tiers: [
    {
      id: "jupiter-card--rain-issued--default",
      productId: "jupiter-card",
      name: "Default",
      legacyRegion: "rain-issued",
    },
    {
      id: "jupiter-card--dcs-issued--default",
      productId: "jupiter-card",
      name: "Default",
      legacyRegion: "dcs-issued",
    },
  ],
  aliases: {},
} satisfies CardConfig;
