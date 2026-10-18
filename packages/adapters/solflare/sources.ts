import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://help.solflare.com/en/articles/12866692-eligibility-when-living-abroad",
    "https://help.solflare.com/en/articles/12866703-solflare-card-currency",
    "https://help.solflare.com/en/articles/12866715-spending-assets-with-solflare-card",
    "https://help.solflare.com/en/articles/12866847-the-solflare-card-bridging-crypto-and-everyday-spending",
    "https://help.solflare.com/en/articles/12866865-funding-and-using-your-solflare-card",
    "https://help.solflare.com/en/articles/12890985-understanding-solflare-card-foreign-exchange-fx-fees",
    "https://help.solflare.com/en/articles/12891104-solflare-card-spending-and-atm-limits",
    "https://help.solflare.com/en/articles/12891686-why-was-my-kyc-verification-declined",
  ],
  allowedDomains: ["help.solflare.com"],
  metadata: [
    {
      url: "https://help.solflare.com/en/articles/12866692-eligibility-when-living-abroad",
      productIds: ["solflare"],
      kind: "availability",
      topics: ["countries", "requirements", "product_status"],
    },
    {
      url: "https://help.solflare.com/en/articles/12866703-solflare-card-currency",
      productIds: ["solflare"],
      kind: "help-article",
      topics: ["fees", "card_type"],
    },
    {
      url: "https://help.solflare.com/en/articles/12866715-spending-assets-with-solflare-card",
      productIds: ["solflare"],
      kind: "help-article",
      topics: ["crypto", "card_type", "fees"],
    },
    {
      url: "https://help.solflare.com/en/articles/12866847-the-solflare-card-bridging-crypto-and-everyday-spending",
      productIds: ["solflare"],
      kind: "help-article",
      topics: [
        "crypto",
        "card_type",
        "fees",
        "requirements",
        "integrations",
        "countries",
        "product_status",
        "rewards",
      ],
    },
    {
      url: "https://help.solflare.com/en/articles/12866865-funding-and-using-your-solflare-card",
      productIds: ["solflare"],
      kind: "help-article",
      topics: [
        "crypto",
        "card_type",
        "fees",
        "integrations",
        "atm",
        "limits",
        "countries",
      ],
    },
    {
      url: "https://help.solflare.com/en/articles/12890985-understanding-solflare-card-foreign-exchange-fx-fees",
      productIds: ["solflare"],
      kind: "help-article",
      topics: ["fees", "card_type"],
    },
    {
      url: "https://help.solflare.com/en/articles/12891104-solflare-card-spending-and-atm-limits",
      productIds: ["solflare"],
      kind: "help-article",
      topics: ["card_type", "atm", "limits"],
    },
    {
      url: "https://help.solflare.com/en/articles/12891686-why-was-my-kyc-verification-declined",
      productIds: ["solflare"],
      kind: "help-article",
      topics: ["requirements", "product_status"],
    },
  ],
} satisfies CardSources;
