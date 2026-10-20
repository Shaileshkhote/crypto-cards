import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "revolut",
      name: "Revolut Prepaid Card",
      defillamaSlug: "revolut-card",
      tiers: [
        {
          id: "revolut--united-states--kids-teens",
          name: "Kids & Teens",
          legacyRegion: "united-states",
        },
        {
          id: "revolut--united-states--standard",
          name: "Standard",
          legacyRegion: "united-states",
        },
        {
          id: "revolut--united-states--premium",
          name: "Premium",
          legacyRegion: "united-states",
        },
        {
          id: "revolut--united-states--metal",
          name: "Metal",
          legacyRegion: "united-states",
        },
        {
          id: "revolut--united-kingdom--standard",
          name: "Standard",
          legacyRegion: "united-kingdom",
          iban: {
            supported: true,
          },
        },
        {
          id: "revolut--united-kingdom--plus",
          name: "Plus",
          legacyRegion: "united-kingdom",
          iban: {
            supported: true,
          },
        },
        {
          id: "revolut--united-kingdom--premium",
          name: "Premium",
          legacyRegion: "united-kingdom",
          iban: {
            supported: true,
          },
        },
        {
          id: "revolut--united-kingdom--metal",
          name: "Metal",
          legacyRegion: "united-kingdom",
          iban: {
            supported: true,
          },
        },
        {
          id: "revolut--united-kingdom--ultra",
          name: "Ultra",
          legacyRegion: "united-kingdom",
          iban: {
            supported: true,
          },
        },
      ],
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
