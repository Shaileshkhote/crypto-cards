import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "hyperbeat",
      id: "hyperbeat",
      name: "Hyperbeat",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      iban: {
        supported: true,
        type: "personal",
      },
      tiers: [
        {
          id: "hyperbeat--global--default",
          name: "Default",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--10m-trading-volume",
          name: "$10M trading volume",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--1m-trading-volume",
          name: "$1M trading volume",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--25m-trading-volume",
          name: "$25M trading volume",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--50m-trading-volume",
          name: "$50M+ trading volume",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--5m-trading-volume",
          name: "$5M trading volume",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
        {
          id: "hyperbeat--global--everyday",
          name: "Everyday",
          lifecycle: "retired",
          retiredAt: "2026-08-29",
          legacyRegion: "global",
        },
      ],
      issuer: {
        id: "third-national",
        name: "Third National",
      },
    },
  ],
} satisfies CardStaticData;
