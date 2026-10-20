import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "jupiter-aggregator",
      id: "jupiter-card",
      name: "Jupiter Card",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "jupiter-card--rain-issued--default",
          name: "Default",
          legacyRegion: "rain-issued",
          issuer: {
            id: "rain",
            name: "Rain",
            country: "US",
          },
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "jupiter-card--dcs-issued--default",
          name: "Default",
          legacyRegion: "dcs-issued",
          issuer: {
            id: "dcs",
            name: "DCS",
            country: "SG",
          },
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "jupiter-card-claynosaurz",
          name: "Claynosaurz card",
          cardTypes: {
            virtual: true,
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
