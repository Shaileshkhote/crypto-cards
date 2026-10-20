import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "mexc",
      id: "mexc-global",
      name: "MEXC Global Card",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      iban: {
        supported: false,
      },
      tiers: [
        {
          id: "mexc-global--international--default",
          name: "Default",
          legacyRegion: "international",
          network: "visa",
          cardTypes: {
            virtual: true,
          },
        },
      ],
    },
    {
      defillamaSlug: "mexc",
      id: "mexc-apac",
      name: "MEXC Card (APAC)",
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
      network: "visa",
      issuer: {
        id: "dcs-card-centre",
        name: "DCS Card Centre Pte. Ltd.",
        country: "SG",
      },
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
    {
      defillamaSlug: "mexc",
      id: "mexc-etherfi",
      name: "MEXC × ether.fi Credit Card",
      tiers: [
        {
          id: "mexc-etherfi--international--default",
          name: "Default",
          legacyRegion: "international",
        },
      ],
      network: "visa",
      cardTypes: {
        virtual: true,
      },
    },
  ],
} satisfies CardStaticData;
