import type { CardConfig } from "@cards/core/schema";

export default {
  id: "tria",
  name: "Tria",
  website: "https://app.tria.so",
  discovery: false,
  products: [
    {
      id: "tria",
      name: "Tria",
      defillamaSlug: "tria-card",
    },
  ],
  tiers: [
    {
      id: "tria--international--default",
      productId: "tria",
      name: "Default",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--default",
      productId: "tria",
      name: "Default",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--growth",
      productId: "tria",
      name: "Growth",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--growth",
      productId: "tria",
      name: "Growth",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--momentum",
      productId: "tria",
      name: "Momentum",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--momentum",
      productId: "tria",
      name: "Momentum",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--premium",
      productId: "tria",
      name: "Premium",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--premium",
      productId: "tria",
      name: "Premium",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--seed",
      productId: "tria",
      name: "Seed",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--seed",
      productId: "tria",
      name: "Seed",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--signature",
      productId: "tria",
      name: "Signature",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--signature",
      productId: "tria",
      name: "Signature",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--vip-infinity",
      productId: "tria",
      name: "VIP Infinity",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--vip-infinity",
      productId: "tria",
      name: "VIP Infinity",
      legacyRegion: "united-states",
    },
    {
      id: "tria--international--vip",
      productId: "tria",
      name: "VIP",
      legacyRegion: "international",
    },
    {
      id: "tria--united-states--vip",
      productId: "tria",
      name: "VIP",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
