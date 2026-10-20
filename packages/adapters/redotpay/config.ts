import type { CardConfig } from "@cards/core/schema";

export default {
  id: "redotpay",
  name: "RedotPay",
  website: "https://helpcenter.redotpay.com",
  discovery: false,
  products: [
    {
      id: "redotpay",
      name: "RedotPay",
      defillamaSlug: "redotpay-card",
    },
  ],
  tiers: [
    {
      id: "redotpay--global--hkd-card",
      productId: "redotpay",
      name: "HKD card",
      legacyRegion: "global",
    },
    {
      id: "redotpay--global--usd-card",
      productId: "redotpay",
      name: "USD card",
      legacyRegion: "global",
    },
  ],
  aliases: {},
} satisfies CardConfig;
