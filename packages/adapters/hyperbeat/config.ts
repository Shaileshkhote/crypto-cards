import type { CardConfig } from "@cards/core/schema";

export default {
  id: "hyperbeat",
  name: "Hyperbeat",
  website: "https://docs.hyperbeat.org",
  discovery: false,
  products: [
    {
      id: "hyperbeat",
      name: "Hyperbeat",
      defillamaSlug: "hyperbeat",
    },
  ],
  tiers: [
    {
      id: "hyperbeat--global--default",
      productId: "hyperbeat",
      name: "Default",
      legacyRegion: "global",
    },
    {
      id: "hyperbeat--global--10m-trading-volume",
      productId: "hyperbeat",
      name: "$10M trading volume",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
    {
      id: "hyperbeat--global--1m-trading-volume",
      productId: "hyperbeat",
      name: "$1M trading volume",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
    {
      id: "hyperbeat--global--25m-trading-volume",
      productId: "hyperbeat",
      name: "$25M trading volume",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
    {
      id: "hyperbeat--global--50m-trading-volume",
      productId: "hyperbeat",
      name: "$50M+ trading volume",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
    {
      id: "hyperbeat--global--5m-trading-volume",
      productId: "hyperbeat",
      name: "$5M trading volume",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
    {
      id: "hyperbeat--global--everyday",
      productId: "hyperbeat",
      name: "Everyday",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
  ],
  aliases: {},
} satisfies CardConfig;
