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

function financialNumbers(quote: string, implicitZero = true) {
  // A short comma fraction immediately before % is unambiguous (e.g. 1,5%).
  // Keep three-digit grouping and ambiguous money such as 10.000$ unchanged.
  const numericText = quote.replace(/([A-Za-z])(?=\d+(?:[.,]\d+)?\s*%)/g, "$1 ").replace(/(?<![\d.,-])(\d+),(\d{1,2})(?=\s*%)/g, "$1.$2");
  const numbers = [...numericText.matchAll(/\b(\d+(?:[,\u00a0 ]\d{3})*(?:\.\d+)?)(?:\s*(k|m|thousand|million)\b)?/gi)].map(match => {
    const [whole, fraction = ""] = match[1].replace(/[,\s]/g, "").replace(/^0+(?=\d)/, "").split(".");
    const scale = /^(m|million)$/i.test(match[2] || "") ? 6 : match[2] ? 3 : 0;
    const digits = whole + fraction + "0".repeat(scale), split = whole.length + scale;
    return `${digits.slice(0, split)}.${digits.slice(split) || "0"}`;
  });
  if (implicitZero && (/\b(free|zero|none|(?:no|without) (?:[\w-]+(?:,\s*|\s+)){0,5}(?:fees?|charges?|cost|markup))(?=\b|\d)/i.test(quote.replace(/\btoll[- ]free\b/gi, "")) ||
      /\b(?:(?:will|shall|do|does|is|are)\s+not|(?:wo|sha|do(?:es)?)n't)\s+(?:be\s+)?charg(?:e|ed)\s+(?:(?:a|an|any)\s+)?(?:[\w-]+\s+){0,3}fees?\b/i.test(quote.replace(/[’‘]/g, "'")) ||
      /\b(?:does|do)(?:\s+not|n't)\s+(?:have|incur)\s+(?:(?:a|an|any)\s+)?(?:[\w-]+(?:,\s*|\s+)){0,5}fees?\b/i.test(quote.replace(/[’‘]/g, "'")) ||
      /\b(?:fees?|charges?)\s+(?:do|does)\s+not\s+apply\b/i.test(quote) ||
      /\b(?:fees?|charges?|cost)\s+(?:(?:is|are)\s+)?(?:currently\s+)?waived\b/i.test(quote) ||
      /[:|]\s*waived\s*(?:[.;|]|$)/i.test(quote))) numbers.push("0");
  return numbers;
}
// Check literal numeric/currency support, not service classification or meaning.
// Schema and exact source citations are validated separately.
export function verifyFinancialEvidence(fact: ExtractionData["facts"][number]) {
  if (!["fees", "rewards", "limits"].includes(fact.field)) return;
  const quote = fact.evidence.quote;
  // "None" or "free" is not a hard limit of zero.
  const numbers = financialNumbers(quote, fact.field !== "limits");
  const errors: string[] = [];
  const visit = (value: unknown, path: string, ruleId?: string) => {
    if (!value || typeof value !== "object") return;
    if ("id" in value && typeof value.id === "string") ruleId = value.id;
    const report = (message: string) => errors.push(`${message} Location: ${path}${ruleId ? ` (rule ${ruleId})` : ""}; target ${[fact.productId, fact.tierId].filter(Boolean).join("/") || "provider"}; citation ${fact.evidence.url}#${fact.evidence.blockId}.`);
    const money = value as { amount?: unknown; currency?: string };
    if (typeof money.amount === "string" && typeof money.currency === "string") {
      const symbol = ({ EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹", KRW: "₩" } as Record<string, string>)[money.currency];
      const dollarPrefixes = ({ USD: ["US"], SGD: ["S", "SG"], AUD: ["A", "AU"], CAD: ["CA"], NZD: ["NZ"], HKD: ["HK"], TWD: ["NT"] } as Record<string, string[]>)[money.currency] || [];
      const dollar = dollarPrefixes.some(prefix => new RegExp(`\\b${prefix}\\$`, "i").test(quote)) || money.currency === "USD" && /(?<![A-Za-z])\$/.test(quote);
      const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(money.currency);
      if (!new RegExp(`\\b${money.currency}\\b`, "i").test(quote) && !dollar && !(symbol && quote.includes(symbol)) && !(name && quote.toLowerCase().includes(name.toLowerCase())))
        report(`Money currency ${money.currency} is absent from its cited block. Preserve the source unit; a percentage or free charge without a currency is not fixed money.`);
    }
    const assetMoney = value as { amount?: unknown; asset?: unknown };
    if (typeof assetMoney.amount === "string" && typeof assetMoney.asset === "string") {
      const escaped = assetMoney.asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i").test(quote))
        report(`Reward asset ${assetMoney.asset} is absent from its cited block. Preserve the explicit source unit; never assume token/fiat parity.`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (["validFrom", "validUntil"].includes(key) && typeof item === "string") {
        const citedDates = [...quote.matchAll(/\b\d{4}-\d{2}-\d{2}\b|\b[A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4}\b/g)]
          .map(m => { const time = Date.parse(`${m[0]} UTC`); return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : m[0]; });
        if (!citedDates.includes(item)) report(`Validity date ${item} is absent from its cited block. Keep unsupported date formats as narrative.`);
      }

      if (["amount", "ratePercent", "count"].includes(key) && (typeof item === "number" || typeof item === "string")) {
        if (!numbers.some(number => compareDecimals(number, String(item)) === 0))
          report(`Financial value ${item} is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative.`);
      } else visit(item, `${path}.${key}`, ruleId);
    }
  };
  visit(fact.value, fact.field);
  if (errors.length) throw new Error(`${errors.join("\n")} Cited text: ${quote.slice(0, 240)}`);
}
