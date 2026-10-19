import type { CardConfig } from "@cards/core/schema";

export default {
  id: "bybit",
  name: "Bybit Card",
  website: "https://www.bybit.com",
  discovery: false,
  products: [
    {
      id: "bybit",
      name: "Bybit Card",
      defillamaSlug: "bybit",
    },
  ],
  tiers: [
    { id: "bybit--asia-pacific--tier-1", productId: "bybit", name: "Asia Pacific Tier 1", legacyRegion: "asia-pacific" },
    { id: "bybit--asia-pacific--tier-2", productId: "bybit", name: "Asia Pacific Tier 2", legacyRegion: "asia-pacific" },
    { id: "bybit--asia-pacific--tier-3", productId: "bybit", name: "Asia Pacific Tier 3", legacyRegion: "asia-pacific" },
    { id: "bybit--australia--tier-1", productId: "bybit", name: "Australia Tier 1", legacyRegion: "australia" },
    { id: "bybit--australia--tier-2", productId: "bybit", name: "Australia Tier 2", legacyRegion: "australia" },
    {
      id: "bybit--argentina--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "argentina",
    },
    {
      id: "bybit--asia-pacific--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "asia-pacific",
    },
    {
      id: "bybit--australia--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "australia",
    },
    {
      id: "bybit--brazil--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "brazil",
    },
    {
      id: "bybit--georgia--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "georgia",
    },
    {
      id: "bybit--kazakhstan-aifc--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "kazakhstan-aifc",
    },
    {
      id: "bybit--mexico--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "mexico",
    },
    {
      id: "bybit--peru--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "peru",
    },
    {
      id: "bybit--eea--default",
      productId: "bybit",
      name: "Default",
      legacyRegion: "eea",
    },
  ],
  aliases: {
    "Bybit Card": "bybit--peru--default",
    "Bybit EU Card": "bybit--eea--default",
  },
} satisfies CardConfig;
