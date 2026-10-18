import type { CardConfig } from "@cards/core/schema";

export default {
  id: "kolo",
  name: "Kolo",
  website: "https://cdn.kolo.xyz",
  discovery: false,
  products: [
    {
      id: "kolo",
      name: "Kolo",
      defillamaSlug: "kolo-card",
    },
  ],
  tiers: [
    {
      id: "kolo--global--eur-card",
      productId: "kolo",
      name: "EUR Card",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
