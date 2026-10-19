import type { Document, ExtractionData } from "./schema";
import { compareDecimals } from "./serialize";
export function verifyEvidence(
  e: { url: string; blockId: string; quote: string },
  docs: Document[],
) {
  return docs.some(
    (d) =>
      d.status === "ok" &&
      d.url === e.url &&
      d.blocks.some((b) => b.id === e.blockId && b.text.includes(e.quote)),
  );
}

// A real citation alone is insufficient: a table's adjacent row must not
// supply an amount/count that is absent from the selected evidence block.
export function verifyFinancialEvidence(fact: ExtractionData["facts"][number]) {
  if (!["fees", "rewards", "limits"].includes(fact.field)) return;
  const quote = fact.evidence.quote;
  const numbers = [...quote.matchAll(/\b(\d+(?:[,\u00a0 ]\d{3})*(?:\.\d+)?)(?:\s*(k|m|thousand|million)\b)?/gi)].map(match => {
    const [whole, fraction = ""] = match[1].replace(/[,\s]/g, "").replace(/^0+(?=\d)/, "").split(".");
    const scale = /^(m|million)$/i.test(match[2] || "") ? 6 : match[2] ? 3 : 0;
    const digits = whole + fraction + "0".repeat(scale), split = whole.length + scale;
    return `${digits.slice(0, split)}.${digits.slice(split) || "0"}`;
  });
  if (/\b(free|zero|none|(?:no|without) (?:[\w-]+(?:,\s*|\s+)){0,5}(?:fees?|charges?|cost|markup))\b/i.test(quote) ||
      /\b(?:will|shall|do|does)\s+not\s+charge\s+(?:(?:a|any)\s+)?(?:[\w-]+\s+){0,3}fees?\b/i.test(quote) ||
      /\b(?:fees?|charges?|cost)\s+(?:is\s+)?(?:currently\s+)?waived\b/i.test(quote)) numbers.push("0");
  const errors: string[] = [];
  const visit = (value: unknown, path: string, ruleId?: string) => {
    if (!value || typeof value !== "object") return;
    if ("id" in value && typeof value.id === "string") ruleId = value.id;
    const report = (message: string) => errors.push(`${message} Location: ${path}${ruleId ? ` (rule ${ruleId})` : ""}; target ${[fact.productId, fact.tierId].filter(Boolean).join("/") || "provider"}; citation ${fact.evidence.url}#${fact.evidence.blockId}.`);
    const money = value as { amount?: unknown; currency?: string };
    if (typeof money.amount === "string" && typeof money.currency === "string") {
      const symbol = ({ USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹", KRW: "₩" } as Record<string, string>)[money.currency];
      const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(money.currency);
      if (!new RegExp(`\\b${money.currency}\\b`, "i").test(quote) && !(symbol && quote.includes(symbol)) && !(name && quote.toLowerCase().includes(name.toLowerCase())))
        report(`Money currency ${money.currency} is absent from its cited block. Preserve the source unit; a percentage or free charge without a currency is not fixed money.`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (["amount", "ratePercent", "count"].includes(key) && (typeof item === "number" || typeof item === "string")) {
        if (!numbers.some(number => compareDecimals(number, String(item)) === 0))
          report(`Financial value ${item} is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative.`);
      } else visit(item, `${path}.${key}`, ruleId);
    }
  };
  visit(fact.value, fact.field);
  if (errors.length) throw new Error(`${errors.join("\n")} Cited text: ${quote.slice(0, 240)}`);
}
