import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "avalanche-card",
      id: "avalanche-card",
      name: "Avalanche Card",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "avalanche-card--international--default",
          name: "Default",
          legacyRegion: "international",
          network: "visa",
          issuer: {
            id: "third-national",
            name: "Third National",
          },
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "avalanche-card--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
          network: "visa",
          issuer: {
            id: "third-national",
            name: "Third National",
            country: "US",
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
