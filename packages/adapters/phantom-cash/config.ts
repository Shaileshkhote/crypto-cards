import type { CardConfig } from "@cards/core/schema";

export default {
  id: "phantom-cash",
  name: "Phantom Cash",
  website: "https://phantom.com",
  discovery: false,
  products: [
    {
      id: "phantom-cash",
      name: "Phantom Cash",
      defillamaSlug: "phantom",
    },
  ],
  tiers: [
    {
      id: "phantom-cash--united-states--default",
      productId: "phantom-cash",
      name: "Default",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
