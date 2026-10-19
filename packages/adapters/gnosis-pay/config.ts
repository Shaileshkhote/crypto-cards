import type { CardConfig } from "@cards/core/schema";

export default {
  id: "gnosis-pay",
  name: "Gnosis Pay",
  retired: true,
  website: "https://gnosispay.com",
  discovery: false,
  products: [
    {
      id: "gnosis-pay",
      name: "Gnosis Pay",
      defillamaSlug: "gnosis-pay",
      lifecycle: "retired",
    },
  ],
  tiers: [
    {
      id: "gnosis-pay--eea--0-1-gno",
      productId: "gnosis-pay",
      name: "0.1 GNO",
      legacyRegion: "eea",
      lifecycle: "retired",
      retiredAt: "2026-10-16",
    },
    {
      id: "gnosis-pay--eea--1-gno",
      productId: "gnosis-pay",
      name: "1 GNO",
      legacyRegion: "eea",
      lifecycle: "retired",
      retiredAt: "2026-10-16",
    },
    {
      id: "gnosis-pay--eea--10-gno",
      productId: "gnosis-pay",
      name: "10 GNO",
      legacyRegion: "eea",
      lifecycle: "retired",
      retiredAt: "2026-10-16",
    },
    {
      id: "gnosis-pay--eea--100-gno",
      productId: "gnosis-pay",
      name: "100 GNO",
      legacyRegion: "eea",
      lifecycle: "retired",
      retiredAt: "2026-10-16",
    },
  ],
  aliases: {},
} satisfies CardConfig;
