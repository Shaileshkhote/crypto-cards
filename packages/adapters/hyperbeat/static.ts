import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "hyperbeat",
      name: "Hyperbeat",
      defillamaSlug: "hyperbeat",
      tiers: [
        {
          id: "hyperbeat--global--default",
          name: "Default",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--10m-trading-volume",
          name: "$10M trading volume",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
        {
          id: "hyperbeat--global--1m-trading-volume",
          name: "$1M trading volume",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
        {
          id: "hyperbeat--global--25m-trading-volume",
          name: "$25M trading volume",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
        {
          id: "hyperbeat--global--50m-trading-volume",
          name: "$50M+ trading volume",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
        {
          id: "hyperbeat--global--5m-trading-volume",
          name: "$5M trading volume",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
        {
          id: "hyperbeat--global--everyday",
          name: "Everyday",
          legacyRegion: "global",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
        },
      ],
    },
  ],
} satisfies CardStaticData;
