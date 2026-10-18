import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "plasma-one",
      name: "Plasma One",
      defillamaSlug: "plasma-one",
      tiers: [
        {
          id: "plasma-one--international--lite",
          name: "Lite",
          legacyRegion: "international",
        },
        {
          id: "plasma-one--united-states--lite",
          name: "Lite",
          legacyRegion: "united-states",
        },
        {
          id: "plasma-one--international--core",
          name: "Core",
          legacyRegion: "international",
        },
        {
          id: "plasma-one--united-states--core",
          name: "Core",
          legacyRegion: "united-states",
        },
        {
          id: "plasma-one--international--platinum",
          name: "Platinum",
          legacyRegion: "international",
        },
        {
          id: "plasma-one--united-states--platinum",
          name: "Platinum",
          legacyRegion: "united-states",
        },
      ],
    },
  ],
} satisfies CardStaticData;
