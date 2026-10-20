import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://docs.solayer.org/resources/legal/intl-card-terms",
    "https://docs.solayer.org/solayer-pay/card",
    "https://docs.solayer.org/solayer-pay/eligibility",
    "https://docs.solayer.org/solayer-pay/faq",
    "https://docs.solayer.org/solayer-pay/fee",
    "https://docs.solayer.org/solayer-pay/point",
    "https://docs.solayer.org/solayer-pay/tutorials/kyc",
    "https://solayer.org/resources/blog/solayer-emerald-card-is-here",
  ],
  allowedDomains: ["docs.solayer.org", "solayer.org"],
  metadata: [
    {
      url: "https://docs.solayer.org/resources/legal/intl-card-terms",
      productIds: ["solayer"],
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
      url: "https://docs.solayer.org/solayer-pay/card",
      productIds: ["solayer"],
      kind: "product-page",
      topics: ["card_type", "product_status", "atm"],
    },
    {
      url: "https://docs.solayer.org/solayer-pay/eligibility",
      productIds: ["solayer"],
      kind: "availability",
      topics: ["countries", "requirements", "product_status"],
    },
    {
      url: "https://docs.solayer.org/solayer-pay/faq",
      productIds: ["solayer"],
      kind: "help-article",
      topics: [
        "fees",
        "requirements",
        "card_type",
        "integrations",
        "atm",
        "countries",
        "limits",
        "product_status",
      ],
    },
    {
      url: "https://docs.solayer.org/solayer-pay/fee",
      productIds: ["solayer"],
      kind: "fee-schedule",
      topics: ["fees", "atm", "limits"],
    },
    {
      url: "https://docs.solayer.org/solayer-pay/point",
      productIds: ["solayer"],
      kind: "product-page",
      topics: ["rewards", "card_type", "product_status"],
    },
    {
      url: "https://docs.solayer.org/solayer-pay/tutorials/kyc",
      productIds: ["solayer"],
      kind: "product-page",
      topics: ["requirements"],
    },
    {
      url: "https://solayer.org/resources/blog/solayer-emerald-card-is-here",
      productIds: ["solayer"],
      kind: "editorial",
      topics: ["rewards", "crypto"],
    },
  ],
} satisfies CardSources;
