import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "etherfi",
      name: "EtherFi",
      defillamaSlug: "etherfi-cash-liquid",
      tiers: [
        {
          id: "etherfi--global--core",
          name: "Core",
          legacyRegion: "global",
        },
        {
          id: "etherfi--global--luxe",
          name: "Luxe",
          legacyRegion: "global",
        },
        {
          id: "etherfi--global--pinnacle",
          name: "Pinnacle",
          legacyRegion: "global",
        },
        {
          id: "etherfi--global--vip",
          name: "VIP",
          legacyRegion: "global",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
