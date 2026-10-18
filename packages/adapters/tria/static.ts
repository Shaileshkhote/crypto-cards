import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "tria",
      name: "Tria",
      defillamaSlug: "tria-card",
      tiers: [
        {
          id: "tria--international--default",
          name: "Default",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--growth",
          name: "Growth",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--growth",
          name: "Growth",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--momentum",
          name: "Momentum",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--momentum",
          name: "Momentum",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--premium",
          name: "Premium",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--premium",
          name: "Premium",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--seed",
          name: "Seed",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--seed",
          name: "Seed",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--signature",
          name: "Signature",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--signature",
          name: "Signature",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--vip-infinity",
          name: "VIP Infinity",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--vip-infinity",
          name: "VIP Infinity",
          legacyRegion: "united-states",
        },
        {
          id: "tria--international--vip",
          name: "VIP",
          legacyRegion: "international",
        },
        {
          id: "tria--united-states--vip",
          name: "VIP",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
