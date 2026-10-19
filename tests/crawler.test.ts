import { it, expect } from "vitest";
import { verifyFinancialEvidence } from "../packages/core/src/evidence";
import {
  parseHtml,
  documentFromText,
  verifyEvidence,
  trustedUrl,
  assertPublic,
} from "@cards/core/crawler";
it("preserves table headings, rows, caveats and effective dates while removing navigation", () => {
  const doc = parseHtml(
    "https://example.com/fees",
    "<title>Fees</title><nav>Ignore this</nav><h1>Effective 2026-09-01</h1><table><tr><th>Tier</th><th>FX</th></tr><tr><td>Core</td><td>1.5%</td></tr></table><p>Excludes cash withdrawals.</p>",
  );
  expect(doc.content).toContain("Tier | FX");
  expect(doc.content).toContain("Core | 1.5%");
  expect(doc.blocks.some(b => b.text.includes("Tier | FX") && b.text.includes("Core | 1.5%"))).toBe(true);
  expect(doc.content).toContain("2026-09-01");
  expect(doc.content).not.toContain("Ignore");
  expect(doc.hash).toBe(
    parseHtml(
      doc.url,
      "<title>Fees</title><nav>Changed navigation</nav><h1>Effective 2026-09-01</h1><table><tr><th>Tier</th><th>FX</th></tr><tr><td>Core</td><td>1.5%</td></tr></table><p>Excludes cash withdrawals.</p>",
    ).hash,
  );
});
it("repeats table headers across bounded blocks without losing rows", () => {
  const rows = Array.from({ length: 80 }, (_, i) => `<tr><td>Country ${i}</td><td>Available</td></tr>`).join("");
  const doc = parseHtml("https://example.com/countries", `<table><tr><th>Country</th><th>Eligibility</th></tr>${rows}</table>`);
  expect(doc.blocks.length).toBeGreaterThan(1);
  expect(doc.blocks.every(b => b.text.startsWith("Country | Eligibility") && b.text.length <= 1600)).toBe(true);
  for (let i = 0; i < 80; i++) expect(doc.content).toContain(`Country ${i} | Available`);
});
it("preserves line breaks and paragraph boundaries inside financial table cells", () => {
  const doc = parseHtml("https://example.com/limits", "<table><tr><th>Service</th><th>Basic</th></tr><tr><td>Free ATM<br>withdrawals</td><td><p>USD 200</p><p>per month</p></td></tr><tr><td>ATM<br>withdrawals cap</td><td>USD 5000<br>per month</td></tr></table>");
  expect(doc.content).toContain("Free ATM withdrawals | USD 200 per month");
  expect(doc.content).toContain("ATM withdrawals cap | USD 5000 per month");
  const block = doc.blocks.find(b => b.text.includes("Free ATM"))!;
  const fact = { field: "limits" as const, productId: "card", tierId: "basic", inherit: false, value: [{ id: "atm", kind: "atm", scope: {}, amount: { amount: "200", currency: "USD" }, period: "month", calculable: true }], evidence: { url: doc.url, blockId: block.id, quote: block.text } };
  expect(() => verifyFinancialEvidence(fact)).toThrow("is an allowance, not a hard withdrawal limit");
  expect(() => verifyFinancialEvidence({ ...fact, value: [{ ...fact.value[0], amount: { amount: "5000", currency: "USD" } }] })).not.toThrow();
});
it("keeps an introductory paragraph with bounded list rows without leaking free context into later charges", () => {
  const rows = Array.from({ length: 80 }, (_, i) => `<li><p>Tier ${i}:</p><p>up to ${100 + i} EUR</p></li>`).join("");
  const doc = parseHtml("https://example.com/allowances", `<p>Free ATM withdrawals per month by tier:</p><ul>${rows}</ul><p>After the allowance: 2% fee.</p>`);
  const allowances = doc.blocks.filter(b => b.text.includes("Tier "));
  expect(allowances.length).toBeGreaterThan(1);
  expect(allowances.every(b => b.text.startsWith("Free ATM withdrawals per month by tier:") && b.text.length <= 1600)).toBe(true);
  for (let i = 0; i < 80; i++) expect(doc.content).toContain(`Tier ${i}: up to ${100 + i} EUR`);
  const block = allowances.find(b => b.text.includes("Tier 79:"))!;
  const fact = { field: "fees" as const, productId: "card", tierId: "tier-79", inherit: false, value: [{ id: "atm", kind: "atm" as const, scope: {}, calculation: "percentage" as const, ratePercent: 0, calculable: true as const, allowance: { amount: { amount: "179", currency: "EUR" }, period: "month" as const } }], evidence: { url: doc.url, blockId: block.id, quote: block.text } };
  expect(() => verifyFinancialEvidence(fact)).not.toThrow();
  expect(() => verifyFinancialEvidence({ ...fact, field: "limits", value: [{ id: "atm", kind: "atm", scope: {}, calculable: true, amount: { amount: "179", currency: "EUR" }, period: "month" }] })).toThrow("is an allowance, not a hard withdrawal limit");
  const paid = doc.blocks.find(b => b.text.includes("After the allowance:"))!;
  expect(paid.text).not.toContain("Free ATM");
  expect(() => verifyFinancialEvidence({ ...fact, value: [{ ...fact.value[0], allowance: undefined }], evidence: { url: doc.url, blockId: paid.id, quote: paid.text } })).toThrow("Financial value 0 is absent");
});
it("checks quote, URL and block together", () => {
  const doc = documentFromText("https://example.com", "FX: 0%.");
  expect(
    verifyEvidence(
      { url: doc.url, blockId: doc.blocks[0].id, quote: "FX: 0%" },
      [doc],
    ),
  ).toBe(true);
  expect(
    verifyEvidence(
      {
        url: "https://attacker.com",
        blockId: doc.blocks[0].id,
        quote: "FX: 0%",
      },
      [doc],
    ),
  ).toBe(false);
});
it("keeps Markdown plan headers with every fee row, including later bounded chunks", () => {
  const header = "| Fee | Platinum | Signature |";
  const rows = Array.from({ length: 70 }, (_, i) => `| ATM service ${i} | $1 + 0.65% | $0 |`);
  const doc = documentFromText("https://example.com/fees", [header, "| --- | --- | --- |", ...rows, "Conditions apply."].join("\n"));
  const tables = doc.blocks.filter(block => block.text.includes("ATM service"));
  expect(tables.length).toBeGreaterThan(1);
  expect(tables.every(block => block.text.startsWith(header) && block.text.length <= 1600)).toBe(true);
  for (const row of rows) expect(tables.some(block => block.text.includes(row))).toBe(true);
  expect(doc.content).toContain("| --- | --- | --- |");
  expect(doc.blocks.at(-1)?.text).toBe("Conditions apply.");
});
it("preserves PDF column alignment for wrapped table headers", () => {
  const text = "                  Premium    Metal\nMonthly fee       $9.99      $16.99";
  const doc = documentFromText("https://example.com/fees.pdf", text, "Fees", [], true);
  expect(doc.content).toBe(text);
  expect(doc.blocks[0].text.indexOf("Premium")).toBe(18);
  expect(doc.blocks[0].text).toContain("Monthly fee");
});
it("rejects untrusted redirects, credentials and private addresses", async () => {
  expect(() => trustedUrl("https://evil.example", ["example.com"])).toThrow();
  expect(() =>
    trustedUrl("https://u:p@example.com", ["example.com"]),
  ).toThrow();
  expect(() => trustedUrl("https://127.0.0.1", ["127.0.0.1"])).toThrow();
  await expect(
    assertPublic("https://localhost", ["localhost"]),
  ).rejects.toThrow();
});
it("extracts text PDFs and leaves textless PDFs pending transcription", async () => {
  const { readFile } = await import("node:fs/promises");
  const { documentFromPdf } = await import("@cards/core/crawler");
  const doc = await documentFromPdf(
    "https://example.com/terms.pdf",
    await readFile(new URL("./fixtures/text-fees.pdf", import.meta.url)),
  );
  expect(doc.status).toBe("ok");
  expect(doc.content).toContain("1.5 percent");
  expect(doc.content).toContain("2026-09-01");
  const blank = await documentFromPdf(
    "https://example.com/image.pdf",
    await readFile(new URL("./fixtures/textless.pdf", import.meta.url)),
  );
  expect(blank.status).toBe("pending_transcription");
}, 30000);
it("rejects malformed PDF input without hanging the caller", async () => {
  const { documentFromPdf } = await import("@cards/core/crawler");
  await expect(documentFromPdf("https://example.com/bad.pdf", Buffer.from("%PDF broken")))
    .rejects.toThrow("PDF text extraction failed");
});
it("keeps meaningful article header dates and footer caveats", () => {
  const doc = parseHtml(
    "https://example.com/terms",
    '<header><h1>Effective 2026-10-01</h1></header><p>Cashback: 3%.</p><footer><p>Only eligible EUR purchases; cash withdrawals are excluded.</p></footer>',
  );
  expect(doc.content).toContain("Effective 2026-10-01");
  expect(doc.content).toContain(
    "Only eligible EUR purchases; cash withdrawals are excluded.",
  );
});
