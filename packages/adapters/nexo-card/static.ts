import type { CardStaticData } from "@cards/core/schema";

export default {
  note: "Imported adapter identities and explicit manual facts; source pages and legacy assumptions have not been re-verified.",
  products: [
    {
      id: "nexo-card",
      name: "Nexo Card",
      defillamaSlug: "nexo-card",
      tiers: [
        {
          id: "nexo-card--eea--credit-mode",
          name: "Credit Mode",
          legacyRegion: "eea",
        },
        {
          id: "nexo-card--eea--debit-mode",
          name: "Debit Mode",
          legacyRegion: "eea",
        },
        {
          id: "nexo-card--united-kingdom--credit-mode",
          name: "Credit Mode",
          legacyRegion: "united-kingdom",
        },
        {
          id: "nexo-card--united-kingdom--debit-mode",
          name: "Debit Mode",
          legacyRegion: "united-kingdom",
        },
        {
          id: "nexo-card--argentina--credit-mode",
          name: "Credit Mode",
          legacyRegion: "argentina",
        },
        {
          id: "nexo-card--argentina--debit-mode",
          name: "Debit Mode",
          legacyRegion: "argentina",
        },
        {
          id: "nexo-card--brazil--credit-mode",
          name: "Credit Mode",
          legacyRegion: "brazil",
        },
        {
          id: "nexo-card--brazil--debit-mode",
          name: "Debit Mode",
          legacyRegion: "brazil",
        },
        {
          id: "nexo-card--mexico--credit-mode",
          name: "Credit Mode",
          legacyRegion: "mexico",
        },
        {
          id: "nexo-card--mexico--debit-mode",
          name: "Debit Mode",
          legacyRegion: "mexico",
        },
      ],
    },
  ],
} satisfies CardStaticData;
