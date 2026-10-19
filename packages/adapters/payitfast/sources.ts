import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://payitfast.com/card-terms",
    "https://payitfast.com/cashback-terms",
    "https://payitfast.com/crypto-atm",
    "https://payitfast.com/faq",
    "https://payitfast.com/master-terms",
    "https://payitfast.com/pricing",
    "https://payitfast.com/prohibited-activities",
    "https://payitfast.com/referral-leaderboard-campaign-terms",
    "https://payitfast.com/user-agreement",
    "https://payitfast.com/visa-card",
  ],
  allowedDomains: ["payitfast.com"],
  metadata: [
    {
      url: "https://payitfast.com/card-terms",
      productIds: ["payitfast"],
      kind: "cardholder-agreement",
      // Pricing defers to applicable terms; the master terms' precedence
      // clause puts product terms above the fee schedule. Reviewed 2026-10-19.
      supersedes: ["https://payitfast.com/pricing"],
      topics: [
        "card_type",
        "fees",
        "requirements",
        "crypto",
        "limits",
        "atm",
        "rewards",
      ],
    },
    {
      url: "https://payitfast.com/cashback-terms",
      productIds: ["payitfast"],
      kind: "rewards-terms",
      topics: ["rewards", "requirements"],
    },
    {
      url: "https://payitfast.com/crypto-atm",
      productIds: ["payitfast"],
      kind: "product-page",
      topics: ["atm"],
    },
    {
      url: "https://payitfast.com/faq",
      productIds: ["payitfast"],
      kind: "help-article",
      topics: ["countries", "requirements"],
    },
    {
      url: "https://payitfast.com/master-terms",
      productIds: ["payitfast"],
      kind: "terms",
      topics: ["requirements", "fees", "rewards"],
    },
    {
      url: "https://payitfast.com/pricing",
      productIds: ["payitfast"],
      kind: "fee-schedule",
      topics: [
        "product_status",
        "card_type",
        "fees",
        "limits",
        "atm",
        "crypto",
        "requirements",
        "integrations",
      ],
    },
    {
      url: "https://payitfast.com/prohibited-activities",
      productIds: ["payitfast"],
      kind: "availability",
      topics: ["countries", "requirements"],
    },
    {
      url: "https://payitfast.com/referral-leaderboard-campaign-terms",
      productIds: ["payitfast"],
      kind: "rewards-terms",
      topics: ["rewards"],
    },
    {
      url: "https://payitfast.com/user-agreement",
      productIds: ["payitfast"],
      kind: "terms",
      topics: ["requirements", "countries"],
    },
    {
      url: "https://payitfast.com/visa-card",
      productIds: ["payitfast"],
      kind: "product-page",
      topics: ["product_status", "card_type", "integrations", "crypto"],
    },
  ],
} satisfies CardSources;
