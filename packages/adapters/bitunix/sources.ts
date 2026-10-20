import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://www.bitunix.com/cards",
    "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-agreement?id=221",
    "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-faq?id=281",
    "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-fee-usage-limit?id=286",
    "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-restricted-jurisdictions?id=282",
    "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-virtual-vs-physical?id=280",
    "https://www.bitunix.com/hub/helpcenter/article/how-to-apply-bitunix-virtual-card?id=284",
    "https://www.bitunix.com/hub/helpcenter/article/introduction-to-card-rewards?id=276",
    "https://www.bitunix.com/hub/helpcenter/article/what-is-bitunix-card?id=279",
  ],
  allowedDomains: ["www.bitunix.com"],
  metadata: [
    {
      url: "https://www.bitunix.com/cards",
      productIds: ["bitunix"],
      kind: "product-page",
      topics: [
        "card_type",
        "product_status",
        "atm",
        "crypto",
        "requirements",
        "rewards",
      ],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-agreement?id=221",
      productIds: ["bitunix"],
      kind: "cardholder-agreement",
      topics: ["requirements", "crypto", "card_type", "fees"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-faq?id=281",
      productIds: ["bitunix"],
      kind: "help-article",
      topics: [
        "card_type",
        "crypto",
        "requirements",
        "rewards",
        "product_status",
        "integrations",
        "atm",
      ],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-fee-usage-limit?id=286",
      productIds: ["bitunix"],
      kind: "fee-schedule",
      topics: ["fees", "atm", "limits", "crypto"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-restricted-jurisdictions?id=282",
      productIds: ["bitunix"],
      kind: "availability",
      topics: ["countries", "requirements"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/bitunix-card-virtual-vs-physical?id=280",
      productIds: ["bitunix"],
      kind: "help-article",
      topics: ["card_type", "integrations"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/how-to-apply-bitunix-virtual-card?id=284",
      productIds: ["bitunix"],
      kind: "help-article",
      topics: ["requirements", "product_status"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/introduction-to-card-rewards?id=276",
      productIds: ["bitunix"],
      kind: "rewards-terms",
      topics: ["rewards", "requirements"],
    },
    {
      url: "https://www.bitunix.com/hub/helpcenter/article/what-is-bitunix-card?id=279",
      productIds: ["bitunix"],
      kind: "help-article",
      topics: ["card_type", "crypto", "product_status"],
    },
  ],
} satisfies CardSources;
