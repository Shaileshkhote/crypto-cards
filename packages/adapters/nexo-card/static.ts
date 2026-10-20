import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "nexo-card",
      id: "nexo-card",
      name: "Nexo Card",
      network: "mastercard",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      iban: {
        supported: true,
        type: "personal",
      },
      tiers: [
        {
          id: "nexo-card--eea--credit-mode",
          name: "Credit Mode",
          legacyRegion: "eea",
        },
        {
          id: "nexo-card--eea--debit-mode",
          name: "Debit Mode",
          legacyRegion: "eea",
        },
        {
          id: "nexo-card--united-kingdom--credit-mode",
          name: "Credit Mode",
          legacyRegion: "united-kingdom",
        },
        {
          id: "nexo-card--united-kingdom--debit-mode",
          name: "Debit Mode",
          legacyRegion: "united-kingdom",
        },
        {
          id: "nexo-card--argentina--credit-mode",
          name: "Credit Mode",
          legacyRegion: "argentina",
        },
        {
          id: "nexo-card--argentina--debit-mode",
          name: "Debit Mode",
          legacyRegion: "argentina",
        },
        {
          id: "nexo-card--brazil--credit-mode",
          name: "Credit Mode",
          legacyRegion: "brazil",
        },
        {
          id: "nexo-card--brazil--debit-mode",
          name: "Debit Mode",
          legacyRegion: "brazil",
        },
        {
          id: "nexo-card--mexico--credit-mode",
          name: "Credit Mode",
          legacyRegion: "mexico",
        },
        {
          id: "nexo-card--mexico--debit-mode",
          name: "Debit Mode",
          legacyRegion: "mexico",
        },
      ],
      issuer: {
        id: "dipocket-uab",
        name: "DiPocket UAB",
        country: "LT",
      },
    },
  ],
} satisfies CardStaticData;
