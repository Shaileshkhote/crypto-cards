import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://legal.avalanchecard.com/legal/avalanche-card-international-card-agreement-94211945",
    "https://legal.avalanchecard.com/legal/avalanche-card-us-card-agreement-bcc089aa",
    "https://legal.avalanchecard.com/legal/avalanche-rewards-terms-of-service",
    "https://legal.avalanchecard.com/legal/opening-account-disclosures-f5b8a3a9",
    "https://www.avalanchecard.com/",
  ],
  allowedDomains: ["legal.avalanchecard.com", "www.avalanchecard.com"],
  metadata: [
    {
      url: "https://legal.avalanchecard.com/legal/avalanche-card-international-card-agreement-94211945",
      productIds: ["avalanche-card"],
      kind: "cardholder-agreement",
      scope: "international",
      topics: [
        "fees",
        "requirements",
        "card_type",
        "atm",
        "limits",
        "countries",
      ],
    },
    {
      url: "https://legal.avalanchecard.com/legal/avalanche-card-us-card-agreement-bcc089aa",
      productIds: ["avalanche-card"],
      kind: "cardholder-agreement",
      scope: "united_states",
      topics: [
        "fees",
        "requirements",
        "card_type",
        "atm",
        "limits",
        "countries",
      ],
    },
    {
      url: "https://legal.avalanchecard.com/legal/avalanche-rewards-terms-of-service",
      productIds: ["avalanche-card"],
      kind: "rewards-terms",
      topics: ["rewards", "card_type"],
    },
    {
      url: "https://legal.avalanchecard.com/legal/opening-account-disclosures-f5b8a3a9",
      productIds: ["avalanche-card"],
      kind: "terms",
      topics: [
        "fees",
        "requirements",
        "card_type",
        "countries",
        "product_status",
      ],
    },
    {
      url: "https://www.avalanchecard.com/",
      productIds: ["avalanche-card"],
      kind: "product-page",
      topics: [
        "fees",
        "requirements",
        "crypto",
        "card_type",
        "integrations",
        "countries",
        "product_status",
      ],
    },
  ],
} satisfies CardSources;
