import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://docs.jup.ag/user-docs/global/spend/faq",
    "https://docs.jup.ag/user-docs/global/spend/fees-and-limits",
    "https://docs.jup.ag/user-docs/global/spend/jupiter-card",
    "https://docs.jup.ag/user-docs/global/spend/rewards-and-referrals",
  ],
  allowedDomains: ["docs.jup.ag"],
  metadata: [
    {
      url: "https://docs.jup.ag/user-docs/global/spend/faq",
      productIds: ["jupiter-card"],
      kind: "help-article",
      scope: ["rain_issued", "dcs_issued"],
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
    {
      url: "https://docs.jup.ag/user-docs/global/spend/fees-and-limits",
      productIds: ["jupiter-card"],
      kind: "fee-schedule",
      scope: ["rain_issued", "dcs_issued"],
      topics: ["fees", "limits"],
    },
    {
      url: "https://docs.jup.ag/user-docs/global/spend/jupiter-card",
      productIds: ["jupiter-card"],
      kind: "product-page",
      scope: ["rain_issued", "dcs_issued"],
      topics: [
        "rewards",
        "fees",
        "requirements",
        "crypto",
        "card_type",
        "integrations",
        "countries",
        "limits",
        "product_status",
      ],
    },
    {
      url: "https://docs.jup.ag/user-docs/global/spend/rewards-and-referrals",
      productIds: ["jupiter-card"],
      kind: "rewards-terms",
      scope: ["rain_issued", "dcs_issued"],
      topics: ["rewards", "requirements", "limits"],
    },
  ],
} satisfies CardSources;
