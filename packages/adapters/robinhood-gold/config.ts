import type { CardConfig } from "@cards/core/schema";

export default {
  id: "robinhood-gold",
  name: "Robinhood Gold Card",
  website: "https://robinhood.com",
  discovery: false,
  products: [
    {
      id: "robinhood-gold",
      name: "Robinhood Gold Card",
      defillamaSlug: "robinhood",
    },
  ],
  tiers: [
    {
      id: "robinhood-gold--united-states--default",
      productId: "robinhood-gold",
      name: "Default",
      legacyRegion: "united-states",
    },
  ],
  aliases: {
    "Robinhood Gold Card": "robinhood-gold--united-states--default",
    "Robinhood Gold Credit Card": "robinhood-gold--united-states--default",
  },
} satisfies CardConfig;
