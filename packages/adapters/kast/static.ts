import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "kast",
      name: "KAST",
      defillamaSlug: "kast-card",
      tiers: [
        {
          id: "kast--international--standard",
          name: "Standard",
          legacyRegion: "international",
        },
        {
          id: "kast--international--premium",
          name: "Premium",
          legacyRegion: "international",
        },
        {
          id: "kast--international--private",
          name: "Private",
          legacyRegion: "international",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
      iban: {
        supported: true,
      },
    },
  ],
} satisfies CardStaticData;
