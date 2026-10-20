import type { CardConfig } from "@cards/core/schema";

export default {
  id: "mexc",
  name: "MEXC",
  website: "https://www.mexc.com",
  discovery: false,
  products: [
    {
      id: "mexc-global",
      name: "MEXC Global Card",
      defillamaSlug: "mexc",
    },
    {
      id: "mexc-apac",
      name: "MEXC Card (APAC)",
      defillamaSlug: "mexc",
    },
    {
      id: "mexc-etherfi",
      name: "MEXC × ether.fi Credit Card",
      defillamaSlug: "mexc",
    },
  ],
  tiers: [
    {
      id: "mexc-global--international--default",
      productId: "mexc-global",
      name: "Default",
      legacyRegion: "international",
    },
    {
      id: "mexc-apac--asia-pacific--standard",
      productId: "mexc-apac",
      name: "Standard",
      legacyRegion: "asia-pacific",
    },
    {
      id: "mexc-apac--asia-pacific--premier",
      productId: "mexc-apac",
      name: "Premier",
      legacyRegion: "asia-pacific",
    },
    {
      id: "mexc-apac--asia-pacific--elite",
      productId: "mexc-apac",
      name: "Elite",
      legacyRegion: "asia-pacific",
    },
    {
      id: "mexc-etherfi--international--default",
      productId: "mexc-etherfi",
      name: "Default",
      legacyRegion: "international",
    },
  ],
  aliases: {
    "MEXC Global Card": "mexc-global--international--default",
    "MEXC Card APAC Standard": "mexc-apac--asia-pacific--standard",
    "MEXC Card APAC Premier": "mexc-apac--asia-pacific--premier",
    "MEXC Card APAC Elite": "mexc-apac--asia-pacific--elite",
    "MEXC ether.fi Credit Card": "mexc-etherfi--international--default",
  },
} satisfies CardConfig;
