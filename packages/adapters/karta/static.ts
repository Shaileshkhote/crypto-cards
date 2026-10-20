import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "karta-card",
      id: "karta",
      name: "Karta",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      tiers: [
        {
          id: "karta--international--default",
          name: "Default",
          legacyRegion: "international",
        },
        {
          id: "karta--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
          issuer: {
            id: "third-national",
            name: "Third National",
            country: "US",
          },
        },
      ],
      issuer: {
        id: "third-national",
        name: "Third National",
      },
    },
  ],
} satisfies CardStaticData;
