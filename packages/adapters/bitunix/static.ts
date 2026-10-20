import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "bitunix",
      id: "bitunix",
      name: "Bitunix Card",
      tiers: [
        {
          id: "bitunix--global--vip-0",
          name: "VIP 0",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-1",
          name: "VIP 1",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-2",
          name: "VIP 2",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-3",
          name: "VIP 3",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-4",
          name: "VIP 4",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-5",
          name: "VIP 5",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-6",
          name: "VIP 6",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-7",
          name: "VIP 7",
          legacyRegion: "global",
        },
        {
          id: "bitunix--global--vip-8",
          name: "VIP 8",
          legacyRegion: "global",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
