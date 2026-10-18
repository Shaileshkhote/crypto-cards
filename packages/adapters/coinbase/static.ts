import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
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
