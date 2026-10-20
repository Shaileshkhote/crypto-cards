import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "metamask-card",
      id: "metamask",
      name: "MetaMask",
      network: "mastercard",
      cardTypes: {
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "metamask--global--default",
          name: "Default",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
          },
        },
        {
          id: "metamask--global--metal",
          name: "Metal",
          legacyRegion: "global",
          network: "mastercard",
          cardTypes: {
            physical: true,
          },
        },
      ],
      issuer: {
        id: "monovate",
        name: "Monovate",
      },
    },
  ],
} satisfies CardStaticData;
