import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "gnosis-pay",
      name: "Gnosis Pay",
      defillamaSlug: "gnosis-pay",
      lifecycle: "retired",
      tiers: [
        {
          id: "gnosis-pay--eea--0-1-gno",
          name: "0.1 GNO",
          legacyRegion: "eea",
          lifecycle: "retired",
          retiredAt: "2026-10-16",
        },
        {
          id: "gnosis-pay--eea--1-gno",
          name: "1 GNO",
          legacyRegion: "eea",
          lifecycle: "retired",
          retiredAt: "2026-10-16",
        },
        {
          id: "gnosis-pay--eea--10-gno",
          name: "10 GNO",
          legacyRegion: "eea",
          lifecycle: "retired",
          retiredAt: "2026-10-16",
        },
        {
          id: "gnosis-pay--eea--100-gno",
          name: "100 GNO",
          legacyRegion: "eea",
          lifecycle: "retired",
          retiredAt: "2026-10-16",
        },
      ],
    },
  ],
} satisfies CardStaticData;
