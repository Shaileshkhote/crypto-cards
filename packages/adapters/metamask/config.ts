import type { CardConfig } from "@cards/core/schema";

export default {
  id: "metamask",
  name: "MetaMask",
  website: "https://metamask.io",
  discovery: false,
  products: [
    {
      id: "metamask",
      name: "MetaMask",
      defillamaSlug: "metamask-card",
    },
  ],
  tiers: [
    {
      id: "metamask--global--default",
      productId: "metamask",
      name: "Default",
      legacyRegion: "global",
    },
    {
      id: "metamask--global--metal",
      productId: "metamask",
      name: "Metal",
      legacyRegion: "global",
    },
  ],
  aliases: {
    Free: "metamask--global--default",
  },
} satisfies CardConfig;
