import type { CardConfig } from "@cards/core/schema";

export default {
  id: "wirex-one",
  name: "Wirex One",
  website: "https://help.wirexapp.com",
  discovery: false,
  products: [
    {
      id: "wirex-one",
      name: "Wirex One",
      defillamaSlug: "wirex-one",
    },
  ],
  tiers: [
    {
      id: "wirex-one--global--base",
      productId: "wirex-one",
      name: "Base",
      legacyRegion: "global",
    },
    {
      id: "wirex-one--global--premium",
      productId: "wirex-one",
      name: "Premium",
      legacyRegion: "global",
    },
    {
      id: "wirex-one--global--elite",
      productId: "wirex-one",
      name: "Elite",
      legacyRegion: "global",
    },
    {
      id: "wirex-one--global--private",
      productId: "wirex-one",
      name: "Private",
      legacyRegion: "global",
    },
    {
      id: "wirex-one--global--bespoke",
      productId: "wirex-one",
      name: "Bespoke",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
