import type { CardStaticData } from "@cards/core/schema";

export default {
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
          network: "mastercard",
        },
        {
          id: "bybit--asia-pacific--default",
          name: "Default",
          legacyRegion: "asia-pacific",
          network: "visa",
        },
        {
          id: "bybit--australia--default",
          name: "Default",
          legacyRegion: "australia",
          network: "mastercard",
        },
        {
          id: "bybit--brazil--default",
          name: "Default",
          legacyRegion: "brazil",
          network: "mastercard",
        },
        {
          id: "bybit--georgia--default",
          name: "Default",
          legacyRegion: "georgia",
          network: "mastercard",
        },
        {
          id: "bybit--kazakhstan-aifc--default",
          name: "Default",
          legacyRegion: "kazakhstan-aifc",
          network: "mastercard",
        },
        {
          id: "bybit--mexico--default",
          name: "Default",
          legacyRegion: "mexico",
          network: "mastercard",
        },
        {
          id: "bybit--peru--default",
          name: "Default",
          legacyRegion: "peru",
          network: "visa",
        },
        {
          id: "bybit--eea--default",
          name: "Default",
          legacyRegion: "eea",
          network: "mastercard",
          iban: {
            supported: true,
          },
        },
        {
          id: "bybit--asia-pacific--tier-1",
          name: "Asia Pacific Tier 1",
          legacyRegion: "asia-pacific",
          network: "visa",
        },
        {
          id: "bybit--asia-pacific--tier-2",
          name: "Asia Pacific Tier 2",
          legacyRegion: "asia-pacific",
          network: "visa",
        },
        {
          id: "bybit--asia-pacific--tier-3",
          name: "Asia Pacific Tier 3",
          legacyRegion: "asia-pacific",
          network: "visa",
        },
        {
          id: "bybit--australia--tier-1",
          name: "Australia Tier 1",
          legacyRegion: "australia",
          network: "mastercard",
        },
        {
          id: "bybit--australia--tier-2",
          name: "Australia Tier 2",
          legacyRegion: "australia",
          network: "mastercard",
        },
      ],
      cardTypes: {
        virtual: true,
        physical: true,
      },
    },
  ],
} satisfies CardStaticData;
