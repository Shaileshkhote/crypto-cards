import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "phantom",
      id: "phantom-cash",
      name: "Phantom Cash",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "phantom-cash--united-states--default",
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
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
