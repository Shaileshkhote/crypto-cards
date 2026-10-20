import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "ethena-pay",
      id: "ethena-pay",
      name: "Ethena Pay",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      tiers: [
        {
          id: "ethena-pay--international--standard",
          name: "Standard",
          legacyRegion: "international",
        },
        {
          id: "ethena-pay--international--pro",
          name: "Pro",
          legacyRegion: "international",
        },
        {
          id: "ethena-pay--international--vip",
          name: "VIP",
          legacyRegion: "international",
        },
      ],
      iban: {
        type: "personal",
        supported: true,
      },
    },
  ],
} satisfies CardStaticData;
