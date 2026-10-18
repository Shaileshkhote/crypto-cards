import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://ruvo.com/cards",
    "https://ruvo.com/help",
    "https://ruvo.com/terms",
  ],
  allowedDomains: ["ruvo.com"],
  metadata: [
    {
      url: "https://ruvo.com/cards",
      productIds: ["ruvo"],
      kind: "product-page",
      topics: ["fees", "card_type", "integrations", "product_status"],
    },
    {
      url: "https://ruvo.com/help",
      productIds: ["ruvo"],
      kind: "help-article",
      topics: ["fees", "card_type", "integrations", "product_status", "limits"],
    },
    {
      url: "https://ruvo.com/terms",
      productIds: ["ruvo"],
      kind: "terms",
      topics: ["card_type", "requirements"],
    },
  ],
} satisfies CardSources;
