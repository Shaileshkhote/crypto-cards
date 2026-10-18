import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "bybit",
      name: "Bybit Card",
      defillamaSlug: "bybit",
      tiers: [
        {
          id: "bybit--argentina--default",
          name: "Default",
          legacyRegion: "argentina",
        },
        {
          id: "bybit--asia-pacific--default",
          name: "Default",
          legacyRegion: "asia-pacific",
        },
        {
          id: "bybit--australia--default",
          name: "Default",
          legacyRegion: "australia",
        },
        {
          id: "bybit--brazil--default",
          name: "Default",
          legacyRegion: "brazil",
        },
        {
          id: "bybit--georgia--default",
          name: "Default",
          legacyRegion: "georgia",
        },
        {
          id: "bybit--kazakhstan-aifc--default",
          name: "Default",
          legacyRegion: "kazakhstan-aifc",
        },
        {
          id: "bybit--mexico--default",
          name: "Default",
          legacyRegion: "mexico",
        },
        {
          id: "bybit--peru--default",
          name: "Default",
          legacyRegion: "peru",
        },
        {
          id: "bybit--eea--default",
          name: "Default",
          legacyRegion: "eea",
        },
      ],
    },
  ],
} satisfies CardStaticData;
