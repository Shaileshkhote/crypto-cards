import {
  Config,
  type Adapter,
  type Document,
  type ExtractionData,
} from "@cards/core/schema";
import { documentFromText } from "@cards/core/crawler";
export const adapter = (id = "example"): Adapter => ({
  config: Config.parse({
    id,
    name: "Example",
    website: "https://example.com",
    discovery: false,
    products: [{ id: "card", name: "Card" }],
    tiers: [
      { id: "core", name: "Core", productId: "card" },
      { id: "luxe", name: "Luxe", productId: "card" },
    ],
  }),
  sources: {
    urls: ["https://example.com/fees"],
    allowedDomains: ["example.com"],
  },
  static: {},
});
export const document = (rate = 1.5) =>
  documentFromText(
    "https://example.com/fees",
    `Core FX fee: ${rate}%.\nLuxe FX fee: 0%.\nVirtual cards are available.`,
  );
export function extraction(doc: Document, rate = 1.5): ExtractionData {
  const evidence = {
    url: doc.url,
    blockId: doc.blocks[0].id,
    quote: doc.blocks[0].text,
  };
  return {
    complete: true,
    products: [],
    tiers: [],
    facts: [
      {
        inherit: false,
        productId: "card",
        tierId: "core",
        field: "fees",
        value: [
          {
            id: "ignored-llm-id",
            kind: "fx",
            calculation: "percentage",
            ratePercent: rate,
            scope: { residentCountries: ["DE"] },
            calculable: true,
          },
        ],
        evidence,
      },
    ],
  };
}
