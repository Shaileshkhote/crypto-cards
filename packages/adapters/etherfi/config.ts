import type { CardConfig } from "@cards/core/schema";

export default {
  id: "etherfi",
  name: "EtherFi",
  website: "https://www.ether.fi",
  discovery: false,
  products: [
    {
      id: "etherfi",
      name: "EtherFi",
      defillamaSlug: "etherfi-cash-liquid",
    },
  ],
  tiers: [
    {
      id: "etherfi--global--core",
      productId: "etherfi",
      name: "Core",
      legacyRegion: "global",
    },
    {
      id: "etherfi--global--luxe",
      productId: "etherfi",
      name: "Luxe",
      legacyRegion: "global",
    },
    {
      id: "etherfi--global--pinnacle",
      productId: "etherfi",
      name: "Pinnacle",
      legacyRegion: "global",
    },
    {
      id: "etherfi--global--vip",
      productId: "etherfi",
      name: "VIP",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
