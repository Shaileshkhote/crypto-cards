import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "tria-card",
      id: "tria",
      name: "Tria",
      network: "visa",
      cardTypes: {
        physical: true,
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "tria--international--default",
          name: "Default",
          legacyRegion: "international",
          network: "visa",
          issuer: {
            id: "nimbus-llc",
            name: "Nimbus, LLC",
            country: "US",
          },
          cardTypes: {
            physical: true,
          },
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
        {
          id: "lite",
          name: "Lite Card",
          cardTypes: {
            virtual: true,
            physical: false,
          },
        },
        {
          id: "max",
          name: "Max Card",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "pro",
          name: "Pro Card",
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "tria-max",
          name: "Max",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "tria-pro",
          name: "Pro",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "tria-us-metal",
          name: "Tria Metal Card",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "tria-us-plastic",
          name: "Tria Plastic Card",
          cardTypes: {
            physical: true,
          },
        },
        {
          id: "tria-us-virtual",
          name: "Tria Virtual Card",
          cardTypes: {
            virtual: true,
          },
        },
      ],
    },
  ],
} satisfies CardStaticData;
