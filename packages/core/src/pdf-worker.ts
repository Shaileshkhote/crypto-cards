import { parentPort, workerData } from "node:worker_threads";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function read() {
  const task = getDocument({
    data: workerData as Uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    // Recoverable font warnings can flood logs on malformed public documents.
    verbosity: 0,
  });
  const parsed = await task.promise;
  try {
    const pages: string[] = [];
    let size = 0;
    for (let i = 1; i <= parsed.numPages; i++) {
      const page = await parsed.getPage(i);
      const content = await page.getTextContent();
      let line = "", y: number | undefined;
      const lines: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const nextY = item.transform[5];
        if (y !== undefined && Math.abs(nextY - y) > 2) {
          lines.push(line);
          line = "";
        }
        line += (line ? " | " : "") + item.str;
        y = nextY;
        if (item.hasEOL) {
          lines.push(line);
          line = "";
          y = undefined;
        }
      }
      if (line) lines.push(line);
      const text = lines.join("\n");
      size += text.length;
      if (size > 5_000_000) throw new Error("PDF text exceeds 5 MB limit");
      pages.push(text);
    }
    return pages.join("\n");
  } finally {
    await task.destroy();
  }
}
read().then(
  (text) => parentPort!.postMessage({ text }),
  (error: unknown) => parentPort!.postMessage({ error: error instanceof Error ? error.message : String(error) }),
);
