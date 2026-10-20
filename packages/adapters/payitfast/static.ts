import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "payitfast",
      id: "payitfast",
      name: "PayitFast Card",
      tiers: [
        {
          id: "payitfast--global--standard",
          name: "Standard",
          legacyRegion: "global",
        },
        {
          id: "payitfast--global--elite",
          name: "Elite",
          legacyRegion: "global",
        },
        {
          id: "signature",
          name: "Signature",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "virtual-platinum",
          name: "Virtual Platinum",
          cardTypes: {
            virtual: true,
          },
        },
      ],
      network: "visa",
    },
  ],
  network: "visa",
} satisfies CardStaticData;
