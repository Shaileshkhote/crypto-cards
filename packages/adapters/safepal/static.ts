import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      id: "safepal",
      name: "SafePal",
      defillamaSlug: "safepal-card",
      lifecycle: "retired",
      tiers: [
        {
          id: "safepal--global--default",
          name: "Default",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-10-16",
        },
      ],
    },
  ],
} satisfies CardStaticData;
