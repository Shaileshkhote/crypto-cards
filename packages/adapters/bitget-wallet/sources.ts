import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://web3.bitget.com/card",
    "https://web3.bitget.com/card-reward",
    "https://web3.bitget.com/en/blog/articles/100-million-users",
    "https://web3.bitget.com/en/blog/articles/bitget-wallet-card-0-fees",
    "https://web3.bitget.com/helpCenter/279",
    "https://web3.bitget.com/helpCenter/431",
    "https://web3.bitget.com/helpCenter/647",
    "https://web3.bitget.com/helpCenter/675",
    "https://web3.bitget.com/legal/card-terms",
  ],
  allowedDomains: ["web3.bitget.com"],
  metadata: [
    {
      url: "https://web3.bitget.com/card",
      productIds: ["bitget-wallet"],
      kind: "product-page",
      topics: ["card_type", "product_status", "fees", "rewards"],
    },
    {
      url: "https://web3.bitget.com/card-reward",
      productIds: ["bitget-wallet"],
      kind: "product-page",
      topics: ["rewards"],
    },
    {
      url: "https://web3.bitget.com/en/blog/articles/100-million-users",
      productIds: ["bitget-wallet"],
      kind: "editorial",
      topics: ["crypto"],
    },
    {
      url: "https://web3.bitget.com/en/blog/articles/bitget-wallet-card-0-fees",
      productIds: ["bitget-wallet"],
      kind: "fee-schedule",
      topics: ["fees"],
    },
    {
      url: "https://web3.bitget.com/helpCenter/279",
      productIds: ["bitget-wallet"],
      kind: "product-page",
      topics: ["crypto"],
    },
    {
      url: "https://web3.bitget.com/helpCenter/431",
      productIds: ["bitget-wallet"],
      kind: "help-article",
      topics: ["product_status", "fees", "rewards"],
    },
    {
      url: "https://web3.bitget.com/helpCenter/647",
      productIds: ["bitget-wallet"],
      kind: "help-article",
      topics: [
        "rewards",
        "card_type",
        "integrations",
        "product_status",
        "fees",
      ],
    },
    {
      url: "https://web3.bitget.com/helpCenter/675",
      productIds: ["bitget-wallet"],
      kind: "help-article",
      topics: [
        "fees",
        "card_type",
        "integrations",
        "atm",
        "countries",
        "limits",
        "product_status",
      ],
    },
    {
      url: "https://web3.bitget.com/legal/card-terms",
      productIds: ["bitget-wallet"],
      kind: "cardholder-agreement",
      topics: [
        "fees",
        "requirements",
        "card_type",
        "atm",
        "limits",
        "countries",
      ],
    },
  ],
} satisfies CardSources;
