import type { CardConfig } from "@cards/core/schema";

export default {
  id: "solflare",
  name: "Solflare",
  website: "https://help.solflare.com",
  discovery: false,
  products: [
    {
      id: "solflare",
      name: "Solflare",
      lifecycle: "retired",
    },
  ],
  tiers: [
    {
      id: "solflare--global--default",
      productId: "solflare",
      name: "Default",
      legacyRegion: "global",
      lifecycle: "retired",
      retiredAt: "2026-08-29",
    },
  ],
  aliases: {},
} satisfies CardConfig;
