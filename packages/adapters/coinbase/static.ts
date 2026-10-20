import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "coinbase-debit-us",
      name: "Coinbase Card (US Debit)",
      defillamaSlug: "coinbase-card",
      tiers: [
        {
          id: "coinbase-debit-us--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
    {
      id: "coinbase-debit-eu-uk",
      name: "Coinbase Card (EU/UK Debit)",
      defillamaSlug: "coinbase-card",
      tiers: [
        {
          id: "coinbase-debit-eu-uk--eea--default",
          name: "Default",
          legacyRegion: "eea",
        },
        {
          id: "coinbase-debit-eu-uk--united-kingdom--default",
          name: "Default",
          legacyRegion: "united-kingdom",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
    {
      id: "coinbase-one",
      name: "Coinbase One Card",
      defillamaSlug: "coinbase-card",
      tiers: [
        {
          id: "coinbase-one--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
      ],
    },
    {
      id: "coinbase-one-secured",
      name: "Coinbase One Card with Security Deposit",
      defillamaSlug: "coinbase-card",
      tiers: [
        {
          id: "coinbase-one-secured--united-states--secured",
          name: "Secured",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
