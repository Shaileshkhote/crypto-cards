import type { CardStaticData } from "@cards/core/schema";

export default {
  products: [
    {
      defillamaSlug: "kolo-card",
      id: "kolo",
      name: "Kolo",
      network: "visa",
      cardTypes: {
        physical: false,
        virtual: true,
      },
      tiers: [
        {
          id: "kolo--global--eur-card",
          name: "EUR Card",
          legacyRegion: "global",
        },
      ],
      issuer: {
        id: "banco-popular-de-puerto-rico",
        name: "Banco Popular de Puerto Rico",
        country: "PR",
      },
    },
  ],
} satisfies CardStaticData;
