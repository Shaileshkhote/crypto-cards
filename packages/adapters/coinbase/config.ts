import type { CardConfig } from "@cards/core/schema";

export default {
  id: "coinbase",
  name: "Coinbase",
  website: "https://help.coinbase.com",
  discovery: false,
  products: [
    {
      id: "coinbase-debit-us",
      name: "Coinbase Card (US Debit)",
      defillamaSlug: "coinbase-card",
    },
    {
      id: "coinbase-debit-eu-uk",
      name: "Coinbase Card (EU/UK Debit)",
      defillamaSlug: "coinbase-card",
    },
    {
      id: "coinbase-one",
      name: "Coinbase One Card",
      defillamaSlug: "coinbase-card",
    },
    {
      id: "coinbase-one-secured",
      name: "Coinbase One Card with Security Deposit",
      defillamaSlug: "coinbase-card",
    },
  ],
  tiers: [
    {
      id: "coinbase-debit-us--united-states--default",
      productId: "coinbase-debit-us",
      name: "Default",
      legacyRegion: "united-states",
    },
    {
      id: "coinbase-debit-eu-uk--eea--default",
      productId: "coinbase-debit-eu-uk",
      name: "Default",
      legacyRegion: "eea",
    },
    {
      id: "coinbase-debit-eu-uk--united-kingdom--default",
      productId: "coinbase-debit-eu-uk",
      name: "Default",
      legacyRegion: "united-kingdom",
    },
    {
      id: "coinbase-one--united-states--default",
      productId: "coinbase-one",
      name: "Default",
      legacyRegion: "united-states",
    },
    {
      id: "coinbase-one-secured--united-states--secured",
      productId: "coinbase-one-secured",
      name: "Secured",
      legacyRegion: "united-states",
    },
  ],
  aliases: {
    "Coinbase Card": "coinbase-debit-eu-uk--united-kingdom--default",
    "Coinbase Debit Card": "coinbase-debit-us--united-states--default",
    "Coinbase One Card": "coinbase-one--united-states--default",
    "Coinbase One Credit Card": "coinbase-one--united-states--default",
    "Coinbase One Card with Security Deposit":
      "coinbase-one-secured--united-states--secured",
    "Coinbase One Secured Card": "coinbase-one-secured--united-states--secured",
  },
} satisfies CardConfig;
