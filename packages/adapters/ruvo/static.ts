import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "ruvo",
      id: "ruvo",
      name: "Ruvo Card",
      inheritFields: [
        "cardTypes",
      ],
      cardTypes: {
        physical: true,
        virtual: true,
      },
      tiers: [
        {
          id: "ruvo--global--default",
          name: "Default",
          legacyRegion: "global",
          network: "visa",
          cardTypes: {
            physical: true,
          },
        },
      ],
      network: "visa",
    },
  ],
} satisfies CardStaticData;
