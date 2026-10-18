import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "crypto-com",
      name: "Crypto.com Card",
      defillamaSlug: "crypto-com",
      tiers: [
        {
          id: "crypto-com--united-states--prepaid",
          name: "Prepaid",
          legacyRegion: "united-states",
        },
        {
          id: "crypto-com--united-states--credit",
          name: "Credit",
          legacyRegion: "united-states",
        },
        {
          id: "crypto-com--eea--prepaid",
          name: "Prepaid",
          legacyRegion: "eea",
        },
        {
          id: "crypto-com--united-kingdom--prepaid",
          name: "Prepaid",
          legacyRegion: "united-kingdom",
        },
        {
          id: "crypto-com--canada--prepaid",
          name: "Prepaid",
          legacyRegion: "canada",
        },
        {
          id: "crypto-com--australia--prepaid",
          name: "Prepaid",
          legacyRegion: "australia",
        },
        {
          id: "crypto-com--singapore--prepaid",
          name: "Prepaid",
          legacyRegion: "singapore",
        },
        {
          id: "crypto-com--latin-america--prepaid",
          name: "Prepaid",
          legacyRegion: "latin-america",
        },
        {
          id: "crypto-com--gulf-cooperation-council--prepaid",
          name: "Prepaid",
          legacyRegion: "gulf-cooperation-council",
        },
      ],
    },
  ],
} satisfies CardStaticData;
