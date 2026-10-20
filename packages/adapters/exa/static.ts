import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "exa-card",
      id: "exa",
      name: "Exa",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      tiers: [
        {
          id: "exa--international--default",
          name: "Default",
          legacyRegion: "international",
          network: "visa",
          issuer: {
            id: "third-national",
            name: "Third National",
          },
        },
        {
          id: "exa--united-states--default",
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
