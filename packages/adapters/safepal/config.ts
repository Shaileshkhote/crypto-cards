import type { CardConfig } from "@cards/core/schema";

export default {
  id: "safepal",
  name: "SafePal",
  retired: true,
  website: "https://safepal.com",
  discovery: false,
  products: [
    {
      id: "safepal",
      name: "SafePal",
      defillamaSlug: "safepal-card",
      lifecycle: "retired",
    },
  ],
  tiers: [
    {
      id: "safepal--global--default",
      productId: "safepal",
      name: "Default",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-10-16",
    },
  ],
  aliases: {},
} satisfies CardConfig;
