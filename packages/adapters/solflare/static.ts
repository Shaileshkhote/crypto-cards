import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "solflare",
      name: "Solflare",
      lifecycle: "retired",
      network: "mastercard",
      cardTypes: {
        virtual: true,
        physical: true,
      },
      tiers: [
        {
          id: "solflare--global--default",
          name: "Default",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
