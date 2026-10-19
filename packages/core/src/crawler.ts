import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { chromium } from "playwright";
import type { Adapter, Document } from "./schema";
import { hash } from "./serialize";

const AGENT = "CryptoCardsBot";
class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}${status === 429 ? " (rate limited; retry later)" : ""}`);
  }
}
export const normalize = (s: string, preserveLayout = false) =>
  s
    .normalize("NFKC")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => preserveLayout ? x.trimEnd() : x.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
export function normalizeUrl(input: string) {
  const u = new URL(input);
  u.hash = "";
  return u.href;
}
export function trustedUrl(input: string, domains: string[]) {
  const u = new URL(input);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443") ||
    !domains.includes(u.hostname) ||
    ipaddr.isValid(u.hostname)
  )
    throw new Error(`Untrusted destination: ${u.origin}`);
  return u;
}
export async function assertPublic(input: string, domains: string[]) {
  const u = trustedUrl(input, domains);
  const addresses = await lookup(u.hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some((x) => ipaddr.process(x.address).range() !== "unicast")
  )
    throw new Error(`Private/internal destination rejected: ${u.hostname}`);
  return u;
}
async function http(
  url: string,
  domains: string[],
  accept = "*/*",
) {
  for (let i = 0; i < 5; i++) {
    await assertPublic(url, domains);
    const r = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": `${AGENT}/1.0`, Accept: accept },
    });
    if (r.status >= 300 && r.status < 400) {
      const location = r.headers.get("location");
      await r.body?.cancel();
      if (!location) throw new Error("Redirect missing location");
      url = new URL(location, url).href;
      continue;
    }
    if (!r.ok) {
      await r.body?.cancel();
      throw new HttpError(r.status);
    }
    const bytes: Uint8Array[] = [];
    let size = 0;
    if (r.body)
      for await (const chunk of r.body) {
        size += chunk.length;
        if (size > 5_000_000) throw new Error("Document exceeds 5 MB limit");
        bytes.push(chunk);
      }
    return {
      bytes: Buffer.concat(bytes),
      type: r.headers.get("content-type") || "",
      url,
    };
  }
  throw new Error("Too many redirects");
}
function tableBlocks(rows: string[]) {
  const chunks: string[] = [];
  let chunk = rows.slice(0, 1);
  for (const row of rows.slice(1)) {
    if ([...chunk, row].join(" ; ").length > 1400 && chunk.length > 1) {
      chunks.push(chunk.join(" ; "));
      chunk = rows.slice(0, 1);
    }
    chunk.push(row);
  }
  if (chunk.length) chunks.push(chunk.join(" ; "));
  return chunks;
}
export function documentFromText(
  url: string,
  text: string,
  title = url,
  links: string[] = [],
  preserveLayout = false,
): Document {
  const content = normalize(text, preserveLayout);
  const originalLines = content.split("\n"), tableLines: string[] = [];
  for (let i = 0; i < originalLines.length; i++) {
    if (!preserveLayout && originalLines[i].includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(originalLines[i + 1] || "")) {
      const rows = [originalLines[i]];
      i++;
      while (originalLines[i + 1]?.includes("|")) rows.push(originalLines[++i]);
      tableLines.push(...tableBlocks(rows));
    } else tableLines.push(originalLines[i]);
  }
  const lines = tableLines.flatMap((line) => {
      const parts: string[] = [];
      while (line.length > 1600) {
        const space = line.lastIndexOf(" ", 1600);
        const end = space > 800 ? space : 1600;
        parts.push(line.slice(0, end));
        line = line.slice(end).trimStart();
      }
      if (line) parts.push(line);
      return parts;
    });
  const passages: string[] = [];
  for (const line of lines) {
    const last = passages.length - 1;
    if (preserveLayout && last >= 0 && passages[last].length + line.length + 1 <= 1600)
      passages[last] += `\n${line}`;
    else passages.push(line);
  }
  const blocks = passages.map(text => ({ id: hash(text).slice(0, 24), text }));
  return {
    url,
    title,
    content,
    hash: hash({ url, content, blocks: blocks.map(block => block.id) }),
    blocks,
    links: [...new Set(links)].sort(),
    status: "ok",
  };
}
export function parseHtml(url: string, html: string): Document {
  const $ = cheerio.load(html);
  const title = $("title").text().trim() || url;
  const links = $("a[href]")
    .map((_, el) => {
      try {
        return normalizeUrl(new URL($(el).attr("href")!, url).href);
      } catch {
        return "";
      }
    })
    .get()
    .filter(Boolean);
  $(
    'script,style,nav,[role="navigation"],noscript,svg,[aria-hidden="true"]',
  ).remove();
  const main = $("main,[role='main']").filter((_, el) => normalize($(el).text()).length > 0).first();
  const articles = $("article").filter((_, el) => normalize($(el).text()).length > 0);
  // React can stream an article outside an initially empty main placeholder.
  const primary = main.length ? main : articles.length === 1 ? articles.first() : $([]);
  if (primary.length) {
    // Shared site chrome and unrelated product promotions are not article
    // content. Keep real card-issuer disclosures commonly placed in footers.
    const disclosures = $("footer p,footer small,[role='contentinfo'] p,[role='contentinfo'] small")
      .filter((_, el) => !$(el).closest("main,[role='main']").length && /\b(?:issued by|issuing bank|card issuer|issuer of (?:the |your )?card)\b/i.test($(el).text()))
      .clone();
    $("body").empty().append(primary, disclosures);
  }
  $("table").each((_, table) => {
    const elements = $(table).find("tr").filter((_, tr) => $(tr).closest("table")[0] === table).toArray();
    const grid: string[][] = [];
    const groupedHeader = elements[0] && $(elements[0]).children("th,td").toArray().some(td => Number($(td).attr("colspan")) > 1);
    let headerRows = 1, cells = 0;
    for (const [row, tr] of elements.entries()) {
      grid[row] ||= [];
      let column = 0;
      for (const td of $(tr).children("th,td").toArray()) {
        while (grid[row][column] !== undefined) column++;
        const cell = $(td).clone();
        cell.find("br").replaceWith(" ");
        cell.find("p,div,section").each((_, el) => { $(el).prepend("\n"); $(el).append("\n"); });
        const text = normalize(cell.text()).replaceAll("\n", " ");
        const span = (name: string, bound: number) => Math.min(bound, Math.max(1, Number.parseInt($(td).attr(name) || "1", 10) || 1));
        const height = $(td).attr("rowspan") === "0" ? elements.length - row : span("rowspan", elements.length - row);
        const width = span("colspan", 100);
        cells += height * width;
        if (cells > 20_000) throw new Error("Expanded HTML table exceeds cell limit");
        // Bybit and other financial tables use TD header cells spanning two
        // rows. Keep the subheaders with every later bounded table chunk.
        if (row === 0 && groupedHeader && height <= 3) headerRows = Math.max(headerRows, height);
        for (let y = 0; y < height; y++) {
          grid[row + y] ||= [];
          for (let x = 0; x < width; x++) grid[row + y][column + x] = text;
        }
        column += width;
      }
    }
    const rows = grid.map(row => Array.from({ length: row.length }, (_, i) => row[i] || "").join(" | "));
    if (headerRows > 1) rows.splice(0, headerRows, rows.slice(0, headerRows).join(" ; "));
    // Keep table headers with their rows in bounded, citable blocks. Splitting
    // every cell row from its header lost plan/currency/period context.
    $(table).replaceWith(`\n${tableBlocks(rows).join("\n")}\n`);
  });
  $("ul,ol").each((_, list) => {
    const paragraph = $(list).prev("p");
    const context = normalize(paragraph.text()).replaceAll("\n", " ");
    if (!context.endsWith(":") || $(list).find("ul,ol").length) return;
    const rows = $(list).children("li").map((_, li) => {
      const item = $(li).clone();
      item.find("p,div,section,br").each((_, el) => {
        $(el).prepend("\n");
        $(el).append("\n");
      });
      return normalize(item.text()).replaceAll("\n", " ");
    }).get();
    if (!rows.length) return;
    // A directly introduced list needs its paragraph, just as table rows
    // need headers. Repeat that real context across bounded groups of rows.
    paragraph.remove();
    $(list).replaceWith($("<div>").text(`\n${tableBlocks([context, ...rows]).join("\n")}\n`));
  });
  $("h1,h2,h3,h4,p,li,div,section,header,footer,br").each((_, el) => {
    $(el).prepend("\n");
    $(el).append("\n");
  });
  return documentFromText(url, $("body").text(), title, links);
}
export class Crawler {
  private robots = new Map<string, Promise<ReturnType<typeof robotsParser>>>();
  private queues = new Map<string, Promise<unknown>>();
  constructor(private adapter: Adapter) {}
  private async allowed(url: string) {
    const u = new URL(url);
    if (!this.robots.has(u.origin))
      this.robots.set(
        u.origin,
        (async () => {
          try {
            const r = await http(
              `${u.origin}/robots.txt`,
              this.adapter.sources.allowedDomains,
              "*/*",
            );
            return robotsParser(`${u.origin}/robots.txt`, r.bytes.toString());
          } catch (e) {
            // RFC 9309 §2.3.1.3: a 4xx robots response means no available
            // robots policy. Explicit disallow rules and server/rate failures
            // still block crawling; fetching the actual resource must succeed.
            if (e instanceof HttpError && e.status >= 400 && e.status < 500 && e.status !== 429)
              return robotsParser(`${u.origin}/robots.txt`, "");
            throw new Error(
              `Cannot verify robots.txt: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        })(),
      );
    const robots = await this.robots.get(u.origin)!;
    if (robots.isAllowed(url, AGENT) === false)
      throw new Error("Disallowed by robots.txt");
    return Math.max(250, (robots.getCrawlDelay(AGENT) || 0) * 1000);
  }
  async fetch(url: string): Promise<Document> {
    const host = new URL(url).hostname;
    const previous = this.queues.get(host) || Promise.resolve();
    const result = previous.catch(() => {}).then(() => this.fetchOne(url));
    this.queues.set(host, result);
    return result;
  }
  private async fetchOne(url: string): Promise<Document> {
    try {
      const normalized = normalizeUrl(url);
      if (
        !this.adapter.config.discovery &&
        !this.adapter.sources.urls.some((u) => normalizeUrl(u) === normalized)
      )
        throw new Error("Discovery disabled: URL is not configured");
      trustedUrl(url, this.adapter.sources.allowedDomains);
      const delay = await this.allowed(url);
      await new Promise((r) => setTimeout(r, delay));
      const r = await http(url, this.adapter.sources.allowedDomains);
      if (
        r.type.includes("pdf") ||
        r.bytes.subarray(0, 4).toString() === "%PDF"
      ) {
        return documentFromPdf(url, r.bytes);
      }
      let doc = r.type.includes("html")
        ? parseHtml(url, r.bytes.toString())
        : documentFromText(url, r.bytes.toString());
      if (r.type.includes("html") && doc.content.length < 120) {
        if (process.env.BROWSER_RENDERING !== "true")
          throw new Error(
            "JavaScript rendering required; enable BROWSER_RENDERING and install Chromium",
          );
        const browser = await chromium.launch({
          headless: true,
          ...(process.env.CHROMIUM_EXECUTABLE_PATH
            ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
            : {}),
          args: ["--disable-dev-shm-usage"],
        });
        try {
          const page = await browser.newPage({ serviceWorkers: "block" });
          let navigations = 0;
          await page.route("**/*", async (route) => {
            try {
              const req = route.request();
              const kind = req.resourceType();
              if (
                !["document", "script", "fetch", "xhr"].includes(kind) ||
                (!req.isNavigationRequest() &&
                  kind !== "script" &&
                  !this.adapter.sources.urls.some(
                    (u) => normalizeUrl(u) === normalizeUrl(req.url()),
                  ))
              ) {
                await route.abort();
                return;
              }
              if (kind === "document" && ++navigations > 5)
                throw new Error("Too many browser redirects");
              await assertPublic(
                req.url(),
                this.adapter.sources.allowedDomains,
              );
              await route.continue();
            } catch {
              await route.abort();
            }
          });
          await page.routeWebSocket("**/*", (socket) => socket.close());
          // Only trusted scripts and configured document/data URLs are allowed.
          await page.goto(r.url, {
            waitUntil: "domcontentloaded",
            timeout: 20_000,
          });
          await page.waitForTimeout(500);
          doc = parseHtml(url, await page.content());
        } finally {
          await browser.close();
        }
        if (doc.content.length < 120)
          throw new Error("Page remains unreadable after browser rendering");
      }
      return doc;
    } catch (e) {
      return {
        url,
        title: url,
        content: "",
        hash: "",
        blocks: [],
        links: [],
        status: "unavailable",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
export { verifyEvidence } from "./evidence";

export async function documentFromPdf(
  url: string,
  bytes: Buffer,
): Promise<Document> {
  const { execFile } = await import("node:child_process");
  // Poppler handles the embedded fonts that stalled PDF.js on real card terms.
  const text = await new Promise<string>((resolve, reject) => {
    const child = execFile(
      "pdftotext", ["-layout", "-enc", "UTF-8", "-", "-"],
      { timeout: 20_000, killSignal: "SIGKILL", maxBuffer: 5_000_000, encoding: "utf8" },
      (error, stdout) => {
        if (error) reject(new Error(`PDF text extraction failed: ${error.message}`));
        else resolve(stdout);
      },
    );
    child.stdin!.on("error", () => {}); // A rejected PDF may close stdin early.
    child.stdin!.end(bytes);
  });
  const doc = documentFromText(url, text, url, [], true);
  return doc.content.length < 30
    ? { ...doc, status: "pending_transcription", error: "PDF has no usable text; transcription required" }
    : doc;
}
