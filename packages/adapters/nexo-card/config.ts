import type { CardConfig } from "@cards/core/schema";

export default {
  id: "nexo-card",
  name: "Nexo Card",
  website: "https://nexo.com",
  discovery: false,
  products: [
    {
      id: "nexo-card",
      name: "Nexo Card",
      defillamaSlug: "nexo-card",
    },
  ],
  tiers: [
    {
      id: "nexo-card--eea--credit-mode",
      productId: "nexo-card",
      name: "Credit Mode",
      legacyRegion: "eea",
    },
    {
      id: "nexo-card--eea--debit-mode",
      productId: "nexo-card",
      name: "Debit Mode",
      legacyRegion: "eea",
    },
    {
      id: "nexo-card--united-kingdom--credit-mode",
      productId: "nexo-card",
      name: "Credit Mode",
      legacyRegion: "united-kingdom",
    },
    {
      id: "nexo-card--united-kingdom--debit-mode",
      productId: "nexo-card",
      name: "Debit Mode",
      legacyRegion: "united-kingdom",
    },
    {
      id: "nexo-card--argentina--credit-mode",
      productId: "nexo-card",
      name: "Credit Mode",
      legacyRegion: "argentina",
    },
    {
      id: "nexo-card--argentina--debit-mode",
      productId: "nexo-card",
      name: "Debit Mode",
      legacyRegion: "argentina",
    },
    {
      id: "nexo-card--brazil--credit-mode",
      productId: "nexo-card",
      name: "Credit Mode",
      legacyRegion: "brazil",
    },
    {
      id: "nexo-card--brazil--debit-mode",
      productId: "nexo-card",
      name: "Debit Mode",
      legacyRegion: "brazil",
    },
    {
      id: "nexo-card--mexico--credit-mode",
      productId: "nexo-card",
      name: "Credit Mode",
      legacyRegion: "mexico",
    },
    {
      id: "nexo-card--mexico--debit-mode",
      productId: "nexo-card",
      name: "Debit Mode",
      legacyRegion: "mexico",
    },
  ],
  aliases: {
    "Nexo Card Credit Mode": "nexo-card--mexico--credit-mode",
    "Nexo Card Debit Mode": "nexo-card--mexico--debit-mode",
  },
} satisfies CardConfig;
