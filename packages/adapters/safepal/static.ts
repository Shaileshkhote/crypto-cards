import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
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
