import type { CardConfig } from "@cards/core/schema";

export default {
  id: "crypto-com",
  name: "Crypto.com Card",
  website: "https://crypto.com",
  discovery: false,
  products: [
    {
      id: "crypto-com",
      name: "Crypto.com Card",
      defillamaSlug: "crypto-com",
    },
  ],
  tiers: [
    {
      id: "crypto-com--united-states--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "united-states",
    },
    {
      id: "crypto-com--united-states--credit",
      productId: "crypto-com",
      name: "Credit",
      legacyRegion: "united-states",
    },
    {
      id: "crypto-com--eea--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "eea",
    },
    {
      id: "crypto-com--united-kingdom--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "united-kingdom",
    },
    {
      id: "crypto-com--canada--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "canada",
    },
    {
      id: "crypto-com--australia--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "australia",
    },
    {
      id: "crypto-com--singapore--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "singapore",
    },
    {
      id: "crypto-com--latin-america--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "latin-america",
    },
    {
      id: "crypto-com--gulf-cooperation-council--prepaid",
      productId: "crypto-com",
      name: "Prepaid",
      legacyRegion: "gulf-cooperation-council",
    },
  ],
  aliases: {
    "Crypto.com Prepaid Card": "crypto-com--gulf-cooperation-council--prepaid",
    "Crypto.com Visa Signature Credit Card":
      "crypto-com--united-states--credit",
  },
} satisfies CardConfig;
