import type { CardConfig } from "@cards/core/schema";

export default {
  id: "karta",
  name: "Karta",
  website: "https://www.conkarta.com",
  discovery: false,
  products: [
    {
      id: "karta",
      name: "Karta",
      defillamaSlug: "karta-card",
    },
  ],
  tiers: [
    {
      id: "karta--international--default",
      productId: "karta",
      name: "Default",
      legacyRegion: "international",
    },
    {
      id: "karta--united-states--default",
      productId: "karta",
      name: "Default",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
