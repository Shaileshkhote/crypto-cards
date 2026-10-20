import type { CardConfig } from "@cards/core/schema";

export default {
  id: "ready",
  retired: true,
  name: "Ready",
  website: "https://www.ready.co",
  discovery: false,
  products: [
    {
      id: "ready",
      name: "Ready",
      defillamaSlug: "ready-card",
      lifecycle: "retired",
    },
  ],
  tiers: [],
  aliases: {},
} satisfies CardConfig;
