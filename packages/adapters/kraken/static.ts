import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "kraken-card",
      id: "kraken",
      name: "Kraken Card",
      network: "mastercard",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "kraken--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
          network: "visa",
          issuer: {
            id: "lead-bank",
            name: "Lead Bank",
            country: "US",
          },
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "kraken--eea--default",
          name: "Default",
          legacyRegion: "eea",
          iban: {
            supported: true,
          },
          network: "mastercard",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "kraken--united-kingdom--default",
          name: "Default",
          legacyRegion: "united-kingdom",
          network: "mastercard",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
