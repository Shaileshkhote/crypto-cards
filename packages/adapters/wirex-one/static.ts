import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "wirex-one",
      id: "wirex-one",
      name: "Wirex One",
      tiers: [
        {
          id: "wirex-one--global--base",
          name: "Base",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
          },
        },
        {
          id: "wirex-one--global--premium",
          name: "Premium",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "wirex-one--global--elite",
          name: "Elite",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "wirex-one--global--private",
          name: "Private",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "wirex-one--global--bespoke",
          name: "Bespoke",
          legacyRegion: "global",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "wirex-metal",
          name: "Metal",
          network: "visa",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "wirex-one-metal",
          name: "Metal",
          network: "visa",
          cardTypes: {
            physical: true,
          },
        },
      ],
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
