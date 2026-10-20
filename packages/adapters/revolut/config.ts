import type { CardConfig } from "@cards/core/schema";

export default {
  id: "revolut",
  name: "Revolut Prepaid Card",
  website: "https://www.revolut.com",
  discovery: false,
  products: [
    {
      id: "revolut",
      name: "Revolut Prepaid Card",
      defillamaSlug: "revolut-card",
    },
  ],
  tiers: [
    {
      id: "revolut--united-states--kids-teens",
      productId: "revolut",
      name: "Kids & Teens",
      legacyRegion: "united-states",
    },
    {
      id: "revolut--united-states--standard",
      productId: "revolut",
      name: "Standard",
      legacyRegion: "united-states",
    },
    {
      id: "revolut--united-states--premium",
      productId: "revolut",
      name: "Premium",
      legacyRegion: "united-states",
    },
    {
      id: "revolut--united-states--metal",
      productId: "revolut",
      name: "Metal",
      legacyRegion: "united-states",
    },
    {
      id: "revolut--united-kingdom--standard",
      productId: "revolut",
      name: "Standard",
      legacyRegion: "united-kingdom",
    },
    {
      id: "revolut--united-kingdom--plus",
      productId: "revolut",
      name: "Plus",
      legacyRegion: "united-kingdom",
    },
    {
      id: "revolut--united-kingdom--premium",
      productId: "revolut",
      name: "Premium",
      legacyRegion: "united-kingdom",
    },
    {
      id: "revolut--united-kingdom--metal",
      productId: "revolut",
      name: "Metal",
      legacyRegion: "united-kingdom",
    },
    {
      id: "revolut--united-kingdom--ultra",
      productId: "revolut",
      name: "Ultra",
      legacyRegion: "united-kingdom",
    },
  ],
  aliases: {
    "Revolut Kids & Teens": "revolut--united-states--kids-teens",
    "Standard Plan": "revolut--united-kingdom--standard",
    "Premium Plan": "revolut--united-kingdom--premium",
    "Metal Plan": "revolut--united-kingdom--metal",
    "Plus Plan": "revolut--united-kingdom--plus",
    "Ultra Plan": "revolut--united-kingdom--ultra",
  },
} satisfies CardConfig;
