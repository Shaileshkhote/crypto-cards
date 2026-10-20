import type { CardConfig } from "@cards/core/schema";

export default {
  id: "bitget-wallet",
  name: "Bitget Wallet",
  website: "https://web3.bitget.com",
  discovery: false,
  products: [
    {
      id: "bitget-wallet",
      name: "Bitget Wallet",
      defillamaSlug: "bitget-wallet-card",
    },
  ],
  tiers: [
    {
      id: "bitget-wallet--asia-pacific--physical-card",
      productId: "bitget-wallet",
      name: "Physical card",
      legacyRegion: "asia-pacific",
    },
  ],
  aliases: {},
} satisfies CardConfig;
