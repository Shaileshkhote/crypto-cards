import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "solflare",
      name: "Solflare",
      lifecycle: "retired",
      tiers: [
        {
          id: "solflare--global--default",
          name: "Default",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
      ],
    },
  ],
} satisfies CardStaticData;
