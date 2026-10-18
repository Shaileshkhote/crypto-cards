import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
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
    },
  ],
} satisfies CardStaticData;
