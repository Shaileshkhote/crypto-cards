import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "picnic",
      id: "picnic",
      name: "Picnic Card",
      inheritFields: [
        "cardTypes",
      ],
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "picnic--global--default",
          name: "Default",
          legacyRegion: "global",
          network: "visa",
          issuer: {
            id: "gnosis-pay",
            name: "Gnosis Pay",
            country: "BR",
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
