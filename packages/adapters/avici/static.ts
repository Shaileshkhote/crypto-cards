import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "avici",
      id: "avici",
      name: "Avici",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "avici--global--platinum",
          name: "Platinum",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "avici--global--signature",
          name: "Signature",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
      ],
      issuer: {
        id: "third-national",
        name: "Third National",
        country: "US",
      },
    },
  ],
} satisfies CardStaticData;
