import { it, expect } from "vitest";
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
  expect(doc.content).toContain("2026-09-01");
  expect(doc.content).not.toContain("Ignore");
  expect(doc.hash).toBe(
    parseHtml(
      doc.url,
      "<title>Fees</title><nav>Changed navigation</nav><h1>Effective 2026-09-01</h1><table><tr><th>Tier</th><th>FX</th></tr><tr><td>Core</td><td>1.5%</td></tr></table><p>Excludes cash withdrawals.</p>",
    ).hash,
  );
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
