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
// A real citation alone is insufficient: a table's adjacent row must not
// supply an amount/count that is absent from the selected evidence block.
export function verifyFinancialEvidence(fact: ExtractionData["facts"][number]) {
  if (fact.field === "cardTypes" && fact.value && typeof fact.value === "object") {
    const citedWords = new Set(fact.evidence.quote.normalize("NFC").toLowerCase().match(/[\p{L}\p{M}]+/gu) || []);
    for (const [kind, words] of [["physical", ["physical", "plastic", "metal", "फ़िज़िकल", "फिजिकल", "भौतिक"]], ["virtual", ["virtual", "digital", "वर्चुअल", "डिजिटल"]]] as const)
      if (typeof (fact.value as Record<string, unknown>)[kind] === "boolean" && !words.some(word => citedWords.has(word)))
        throw new Error(`${kind} card availability is absent from its cited block. Cite explicit support for each card type separately; one type does not establish the other.`);
  }
  if (["residentCountries", "excludedResidentCountries"].includes(fact.field) && Array.isArray(fact.value)) {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    const shortNames = new Intl.DisplayNames(["en"], { type: "region", style: "short" });
    const aliases: Record<string, string[]> = { GB: ["UK", "United Kingdom"], US: ["USA", "United States"], AE: ["UAE"], HK: ["Hong Kong"], MO: ["Macau", "Macao"], TR: ["Turkey", "Türkiye"], CZ: ["Czech Republic"] };
    const countryText = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[’‘]/g, "'")
      .replace(/&/g, " and ").replace(/\bst\.?\s+/gi, "Saint ").replace(/\band\s+the\b/gi, "and").replace(/\s+/g, " ").trim();
    const missing = (fact.value as string[]).filter(code => {
      const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return !new RegExp(`\\b${escape(code)}\\b`).test(fact.evidence.quote) &&
        ![names.of(code)!, shortNames.of(code)!, ...(aliases[code] || [])].some(name => new RegExp(`(?:^|\\W)${escape(countryText(name))}(?:$|\\W)`, "i").test(countryText(fact.evidence.quote)));
    });
    if (missing.length) throw new Error(`Country values ${missing.join(", ")} are absent from their cited block. Cite the actual country rows separately, never a heading or an adjacent block; do not infer countries from a region label. Citation ${fact.evidence.url}#${fact.evidence.blockId}.`);
  }
  if (!["fees", "rewards", "limits"].includes(fact.field)) return;
  const quote = fact.evidence.quote;
  // "None" or "free" is not a hard limit of zero.
  const numbers = financialNumbers(quote, fact.field !== "limits");
  const markupOnlyZero = fact.field === "fees" && !numbers.some(n => compareDecimals(n, "0") === 0) && /\b(?:(?:do|does|will|shall)\s+not|(?:do(?:es)?|wo|sha)n't)\s+add\s+anything\s+on\s+top\b/i.test(quote.replace(/[’‘]/g, "'"));
  if (markupOnlyZero) numbers.push("0");
  const freeAtm = (text: string) => /\b(?:fee[-\s]free|free)\s+(?:atm|(?:cash\s+)?withdrawals?)\b/i.test(text);
  const rows = fact.field === "limits" ? quote.split(/\s*;\s*/).map(text => ({ text, numbers: financialNumbers(text, false) })) : [];
  const freeList = rows.length > 1 && rows[0].text.trim().endsWith(":") && freeAtm(rows[0].text);
  const aboveAtm = /\batm\s+withdrawals?\b[^;|]*\b(?:above|beyond|after)\b/i.test(quote);
  const freeRow = (text: string) => {
    const cells = text.trim().replace(/^\|\s*/, "").split("|");
    return freeAtm(cells[0]) || aboveAtm && /\batm\s+withdrawals?\b/i.test(cells[0]) && /\b(?:up to|first|allowance)\b/i.test(cells[0]) && cells.slice(1).some(cell => /^\s*0(?:\.0+)?\s*%\s*$/.test(cell));
  };
  const errors: string[] = [];
  const visit = (value: unknown, path: string, ruleId?: string) => {
    if (!value || typeof value !== "object") return;
    if ("id" in value && typeof value.id === "string") ruleId = value.id;
    const report = (message: string) => errors.push(`${message} Location: ${path}${ruleId ? ` (rule ${ruleId})` : ""}; target ${[fact.productId, fact.tierId].filter(Boolean).join("/") || "provider"}; citation ${fact.evidence.url}#${fact.evidence.blockId}.`);
    const fee = value as { kind?: string; ratePercent?: number; fixed?: { amount: string }; scope?: { conditions?: string[] } };
    if (fact.field === "fees" && fee.kind === "returned_payment" && !/\b(?:return\w*|revers\w*|dishono[u]?r\w*|bounc\w*)\b|\b(?:check|cheque|payment)\b.{0,40}\b(?:fail\w*|declin\w*)\b/i.test(quote))
      report("Returned-payment fees require a returned, reversed or dishonoured payment in the cited block. A late-payment clause does not support a returned-payment charge.");
    const periods: Record<string, RegExp> = { day: /\b(?:day|daily|24[-\s]?(?:hours?|hrs?|h))\b/i, week: /\b(?:week|weekly)\b/i, month: /\b(?:month|monthly)\b|\/mo\b/i, year: /\b(?:year|yearly|annual|annually|annum)\b/i };
    const period = fact.field === "fees" ? ({ monthly: "month", annual: "year" } as Record<string, string>)[fee.kind || ""] : fact.field === "limits" && "calculable" in value && value.calculable === true && "period" in value ? String(value.period) : undefined;
    if (period && periods[period] && !periods[period].test(quote))
      report(`Period ${period} is absent from its cited block. Never invent a calendar period for consecutive transactions or use an annual-fee quote for a monthly fee. Preserve an unsupported limit period as a non-calculable description without amount/count.`);
    if (markupOnlyZero && fee.kind && (fee.ratePercent === 0 || fee.fixed && compareDecimals(fee.fixed.amount, "0") === 0) && !fee.scope?.conditions?.some(condition => /markup|provider|additional|add[- ]?on|on top/i.test(condition)))
      report("Not adding anything on top establishes zero provider/add-on markup, not a zero total charge. Scope the zero to that explicit charge component and preserve the network charge separately.");
    if (fact.field === "fees" && "kind" in value && value.kind === "atm") {
      const rails = (value as { scope?: { paymentRails?: string[] } }).scope?.paymentRails || [];
      if (rails.some(rail => /^(?:ach|wire|sepa)(?:-|$)/i.test(rail)))
        report("Bank-account withdrawals over ACH, wire or SEPA are not ATM cash withdrawals. Use kind other with a bank-withdrawal serviceId; preserve the actual bank rail and conditions.");
    }
    const money = value as { amount?: unknown; currency?: string };
    if (typeof money.amount === "string" && typeof money.currency === "string") {
      const symbol = ({ EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹", KRW: "₩" } as Record<string, string>)[money.currency];
      const dollarPrefixes = ({ USD: ["US"], SGD: ["S", "SG"], AUD: ["A", "AU"], CAD: ["CA"], NZD: ["NZ"], HKD: ["HK"], TWD: ["NT"] } as Record<string, string[]>)[money.currency] || [];
      const dollar = dollarPrefixes.some(prefix => new RegExp(`\\b${prefix}\\$`, "i").test(quote)) || money.currency === "USD" && /(?<![A-Za-z])\$/.test(quote);
      const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(money.currency);
      if (!new RegExp(`\\b${money.currency}\\b`, "i").test(quote) && !dollar && !(symbol && quote.includes(symbol)) && !(name && quote.toLowerCase().includes(name.toLowerCase())))
        report(`Money currency ${money.currency} is absent from its cited block. Preserve the source unit; a percentage or free charge without a currency is not fixed money.`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (["amount", "ratePercent", "count"].includes(key) && (typeof item === "number" || typeof item === "string")) {
        const matchingRows = rows.filter(row => row.numbers.some(number => compareDecimals(number, String(item)) === 0));
        if (fact.field === "limits" && matchingRows.length && matchingRows.every(row => freeList || row.text.includes("|") && freeRow(row.text)))
          report(`Fee-free ATM amount/count ${item} is an allowance, not a hard withdrawal limit. Use fees[].allowance for money or fee scope.conditions for free counts. Keep actual withdrawal limits separately.`);
        if (!numbers.some(number => compareDecimals(number, String(item)) === 0))
          report(`Financial value ${item} is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative.`);
      } else visit(item, `${path}.${key}`, ruleId);
    }
  };
  visit(fact.value, fact.field);
  if (errors.length) throw new Error(`${errors.join("\n")} Cited text: ${quote.slice(0, 240)}`);
}
