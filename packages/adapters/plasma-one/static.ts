import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "plasma-one",
      id: "plasma-one",
      name: "Plasma One",
      network: "visa",
      issuer: {
        name: "Rain",
      },
      cardTypes: {
        virtual: true,
        physical: true,
      },
      tiers: [
        {
          id: "plasma-one--international--lite",
          name: "Lite",
          legacyRegion: "international",
          cardTypes: {
            physical: false,
            virtual: true,
          },
          network: "visa",
          issuer: {
            id: "rain",
            name: "Rain",
            country: "US",
          },
        },
        {
          id: "plasma-one--united-states--lite",
          name: "Lite",
          legacyRegion: "united-states",
          cardTypes: {
            physical: false,
            virtual: true,
          },
        },
        {
          id: "plasma-one--international--core",
          name: "Core",
          legacyRegion: "international",
          network: "visa",
        },
        {
          id: "plasma-one--united-states--core",
          name: "Core",
          legacyRegion: "united-states",
          network: "visa",
        },
        {
          id: "plasma-one--international--platinum",
          name: "Platinum",
          legacyRegion: "international",
          cardTypes: {
            physical: true,
            virtual: true,
          },
          network: "visa",
        },
        {
          id: "plasma-one--united-states--platinum",
          name: "Platinum",
          legacyRegion: "united-states",
          cardTypes: {
            physical: true,
            virtual: true,
          },
          network: "visa",
        },
      ],
    },
  ],
  network: "visa",
  issuer: {
    id: "rain",
    name: "Rain",
    country: "US",
  },
} satisfies CardStaticData;
