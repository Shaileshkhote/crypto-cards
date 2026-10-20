import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://vaultleap.com/",
    "https://vaultleap.com/card",
    "https://vaultleap.com/cashback",
    "https://vaultleap.com/cashback/terms",
    "https://vaultleap.com/help-center/receiving-sending/supported-currencies",
    "https://vaultleap.com/help-center/vaultleap-card-help-support/card-regions-supported",
    "https://vaultleap.com/help-center/vaultleap-card-how-it-works/card-limits-fees",
    "https://vaultleap.com/help-center/vaultleap-card-how-it-works/get-your-card",
    "https://vaultleap.com/help-center/vaultleap-card-how-it-works/spend-anywhere",
    "https://vaultleap.com/pricing",
    "https://www.bridge.xyz/card-agreements/vaultleap-card",
  ],
  allowedDomains: ["vaultleap.com", "www.bridge.xyz"],
  metadata: [
    {
      url: "https://vaultleap.com/",
      productIds: ["vaultleap"],
      kind: "product-page",
      topics: ["card_type", "product_status"],
    },
    {
      url: "https://vaultleap.com/card",
      productIds: ["vaultleap"],
      kind: "product-page",
      topics: ["card_type", "integrations", "fees", "crypto", "product_status"],
    },
    {
      url: "https://vaultleap.com/cashback",
      productIds: ["vaultleap"],
      kind: "product-page",
      topics: ["rewards", "card_type", "product_status"],
    },
    {
      url: "https://vaultleap.com/cashback/terms",
      productIds: ["vaultleap"],
      kind: "rewards-terms",
      topics: ["rewards"],
    },
    {
      url: "https://vaultleap.com/help-center/receiving-sending/supported-currencies",
      productIds: ["vaultleap"],
      kind: "help-article",
      topics: ["integrations"],
    },
    {
      url: "https://vaultleap.com/help-center/vaultleap-card-help-support/card-regions-supported",
      productIds: ["vaultleap"],
      kind: "availability",
      topics: ["countries", "requirements", "product_status", "card_type"],
    },
    {
      url: "https://vaultleap.com/help-center/vaultleap-card-how-it-works/card-limits-fees",
      productIds: ["vaultleap"],
      kind: "fee-schedule",
      topics: ["fees", "atm", "limits", "card_type"],
    },
    {
      url: "https://vaultleap.com/help-center/vaultleap-card-how-it-works/get-your-card",
      productIds: ["vaultleap"],
      kind: "help-article",
      topics: ["requirements", "card_type", "product_status"],
    },
    {
      url: "https://vaultleap.com/help-center/vaultleap-card-how-it-works/spend-anywhere",
      productIds: ["vaultleap"],
      kind: "help-article",
      topics: ["fees", "card_type", "product_status"],
    },
    {
      url: "https://vaultleap.com/pricing",
      productIds: ["vaultleap"],
      kind: "fee-schedule",
      topics: ["fees", "atm", "limits"],
    },
    {
      url: "https://www.bridge.xyz/card-agreements/vaultleap-card",
      productIds: ["vaultleap"],
      kind: "cardholder-agreement",
      topics: [
        "fees",
        "requirements",
        "crypto",
        "card_type",
        "integrations",
        "atm",
        "limits",
      ],
    },
  ],
} satisfies CardSources;
