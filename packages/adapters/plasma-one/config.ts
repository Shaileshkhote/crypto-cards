import type { CardConfig } from "@cards/core/schema";

export default {
  id: "plasma-one",
  name: "Plasma One",
  website: "https://www.plasma.org",
  discovery: false,
  products: [
    {
      id: "plasma-one",
      name: "Plasma One",
      defillamaSlug: "plasma-one",
    },
  ],
  tiers: [
    {
      id: "plasma-one--international--lite",
      productId: "plasma-one",
      name: "Lite",
      legacyRegion: "international",
    },
    {
      id: "plasma-one--united-states--lite",
      productId: "plasma-one",
      name: "Lite",
      legacyRegion: "united-states",
    },
    {
      id: "plasma-one--international--core",
      productId: "plasma-one",
      name: "Core",
      legacyRegion: "international",
    },
    {
      id: "plasma-one--united-states--core",
      productId: "plasma-one",
      name: "Core",
      legacyRegion: "united-states",
    },
    {
      id: "plasma-one--international--platinum",
      productId: "plasma-one",
      name: "Platinum",
      legacyRegion: "international",
    },
    {
      id: "plasma-one--united-states--platinum",
      productId: "plasma-one",
      name: "Platinum",
      legacyRegion: "united-states",
    },
  ],
  aliases: {},
} satisfies CardConfig;
