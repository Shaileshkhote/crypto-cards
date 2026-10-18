import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://cdn.kolo.xyz/public/privacy-policy",
    "https://cdn.kolo.xyz/public/terms-of-use",
    "https://kkinvesting.io/en/posts/kolo-card/",
    "https://kolo.xyz/",
    "https://kolo.xyz/blog/crypto-card-fees-interchange-fx-spread",
    "https://kolo.xyz/blog/usdt-visa-card-spend-crypto-like-cash-in-2026",
    "https://kolo.xyz/blog/whats-new-in-kolo",
    "https://kolo.xyz/countries",
    "https://kolo.xyz/cryptowallet",
    "https://kolo.xyz/exchange-crypto",
  ],
  allowedDomains: ["cdn.kolo.xyz", "kkinvesting.io", "kolo.xyz"],
  metadata: [
    {
      url: "https://cdn.kolo.xyz/public/privacy-policy",
      productIds: ["kolo"],
      kind: "product-page",
      topics: ["requirements"],
    },
    {
      url: "https://cdn.kolo.xyz/public/terms-of-use",
      productIds: ["kolo"],
      kind: "terms",
      topics: ["requirements", "crypto", "card_type"],
    },
    {
      url: "https://kkinvesting.io/en/posts/kolo-card/",
      productIds: ["kolo"],
      kind: "product-page",
      topics: ["rewards"],
    },
    {
      url: "https://kolo.xyz/",
      productIds: ["kolo"],
      kind: "product-page",
      topics: ["card_type", "product_status", "rewards"],
    },
    {
      url: "https://kolo.xyz/blog/crypto-card-fees-interchange-fx-spread",
      productIds: ["kolo"],
      kind: "editorial",
      topics: ["fees", "requirements"],
    },
    {
      url: "https://kolo.xyz/blog/usdt-visa-card-spend-crypto-like-cash-in-2026",
      productIds: ["kolo"],
      kind: "editorial",
      topics: ["crypto", "card_type", "integrations"],
    },
    {
      url: "https://kolo.xyz/blog/whats-new-in-kolo",
      productIds: ["kolo"],
      kind: "editorial",
      scope: ["eur_card", "global_atm"],
      topics: ["rewards", "atm", "limits", "fees", "product_status"],
    },
    {
      url: "https://kolo.xyz/countries",
      productIds: ["kolo"],
      kind: "availability",
      topics: ["countries", "requirements", "product_status"],
    },
    {
      url: "https://kolo.xyz/cryptowallet",
      productIds: ["kolo"],
      kind: "product-page",
      topics: [
        "crypto",
        "integrations",
        "requirements",
        "card_type",
        "product_status",
      ],
    },
    {
      url: "https://kolo.xyz/exchange-crypto",
      productIds: ["kolo"],
      kind: "product-page",
      topics: ["crypto", "integrations", "requirements"],
    },
  ],
} satisfies CardSources;
