import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "solayer-card",
      id: "solayer",
      name: "Solayer",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "solayer--international--default",
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
      ],
    },
  ],
} satisfies CardStaticData;
