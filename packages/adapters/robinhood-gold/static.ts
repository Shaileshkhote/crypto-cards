import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "robinhood",
      id: "robinhood-gold",
      name: "Robinhood Gold Card",
      tiers: [
        {
          id: "robinhood-gold--united-states--default",
          name: "Default",
          legacyRegion: "united-states",
          network: "visa",
          issuer: {
            id: "coastal-community-bank",
            name: "Coastal Community Bank",
            country: "US",
          },
          cardTypes: {
            virtual: true,
            physical: true,
          },
        },
        {
          id: "solid-gold",
          name: "Solid Gold Card: Visa Infinite",
          issuer: {
            id: "coastal-community-bank",
            name: "Coastal Community Bank",
            country: "US",
          },
        },
        {
          id: "standard-gold",
          name: "Standard Gold Card: Visa Signature",
          issuer: {
            id: "coastal-community-bank",
            name: "Coastal Community Bank",
            country: "US",
          },
        },
      ],
      network: "visa",
      issuer: {
        id: "coastal-community-bank",
        name: "Coastal Community Bank",
        country: "US",
      },
    },
  ],
} satisfies CardStaticData;
