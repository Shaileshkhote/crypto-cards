import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://help.ready.co/hc/en-us/articles/28159675604765-Which-cryptocurrencies-does-Ready-account-support",
    "https://help.ready.co/hc/en-us/articles/28160011828893-Ready-Card-privacy-and-security-FAQ",
    "https://help.ready.co/hc/en-us/articles/28160052020893-Ready-Card-fees-and-payments",
    "https://help.ready.co/hc/en-us/articles/36906149111197-Why-is-my-card-being-deactivated",
    "https://www.ready.co/blog/card-faqs",
    "https://www.ready.co/card",
    "https://www.ready.co/legal/ready-app-terms-of-service",
    "https://www.ready.co/legal/ready-rewards-terms-and-conditions",
  ],
  allowedDomains: ["help.ready.co", "www.ready.co"],
  metadata: [
    {
      url: "https://help.ready.co/hc/en-us/articles/28159675604765-Which-cryptocurrencies-does-Ready-account-support",
      productIds: ["ready"],
      kind: "help-article",
      topics: ["crypto"],
    },
    {
      url: "https://help.ready.co/hc/en-us/articles/28160011828893-Ready-Card-privacy-and-security-FAQ",
      productIds: ["ready"],
      kind: "help-article",
      topics: ["requirements"],
    },
    {
      url: "https://help.ready.co/hc/en-us/articles/28160052020893-Ready-Card-fees-and-payments",
      productIds: ["ready"],
      kind: "help-article",
      topics: ["fees", "card_type"],
    },
    {
      url: "https://help.ready.co/hc/en-us/articles/36906149111197-Why-is-my-card-being-deactivated",
      productIds: ["ready"],
      kind: "help-article",
      topics: ["requirements", "card_type", "product_status"],
    },
    {
      url: "https://www.ready.co/blog/card-faqs",
      productIds: ["ready"],
      kind: "editorial",
      topics: [
        "rewards",
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
      url: "https://www.ready.co/card",
      productIds: ["ready"],
      kind: "product-page",
      topics: [
        "rewards",
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
      url: "https://www.ready.co/legal/ready-app-terms-of-service",
      productIds: ["ready"],
      kind: "terms",
      topics: ["requirements", "fees", "product_status"],
    },
    {
      url: "https://www.ready.co/legal/ready-rewards-terms-and-conditions",
      productIds: ["ready"],
      kind: "rewards-terms",
      topics: ["rewards", "requirements", "fees"],
    },
  ],
} satisfies CardSources;
