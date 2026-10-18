import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "mexc-global",
      name: "MEXC Global Card",
      defillamaSlug: "mexc",
      tiers: [
        {
          id: "mexc-global--international--default",
          name: "Default",
          legacyRegion: "international",
        },
      ],
    },
    {
      id: "mexc-apac",
      name: "MEXC Card (APAC)",
      defillamaSlug: "mexc",
      tiers: [
        {
          id: "mexc-apac--asia-pacific--standard",
          name: "Standard",
          legacyRegion: "asia-pacific",
        },
        {
          id: "mexc-apac--asia-pacific--premier",
          name: "Premier",
          legacyRegion: "asia-pacific",
        },
        {
          id: "mexc-apac--asia-pacific--elite",
          name: "Elite",
          legacyRegion: "asia-pacific",
        },
      ],
    },
    {
      id: "mexc-etherfi",
      name: "MEXC × ether.fi Credit Card",
      defillamaSlug: "mexc",
      tiers: [
        {
          id: "mexc-etherfi--international--default",
          name: "Default",
          legacyRegion: "international",
        },
      ],
    },
  ],
} satisfies CardStaticData;
