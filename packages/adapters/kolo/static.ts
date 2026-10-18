import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "kolo",
      name: "Kolo",
      defillamaSlug: "kolo-card",
      tiers: [
        {
          id: "kolo--global--eur-card",
          name: "EUR Card",
          legacyRegion: "global",
        },
      ],
    },
  ],
} satisfies CardStaticData;
