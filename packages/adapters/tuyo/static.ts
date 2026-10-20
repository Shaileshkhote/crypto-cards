import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "tuyo-card",
      id: "tuyo",
      name: "Tuyo",
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
      iban: {
        supported: true,
      },
      tiers: [
        {
          id: "tuyo--global--default",
          name: "Default",
          legacyRegion: "global",
          network: "visa",
          issuer: {
            id: "rain",
            name: "Signify Holdings, Inc. (Rain)",
            country: "US",
          },
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
      ],
      issuer: {
        id: "rain",
        name: "Signify Holdings, Inc. (Rain)",
        country: "US",
      },
    },
  ],
} satisfies CardStaticData;
