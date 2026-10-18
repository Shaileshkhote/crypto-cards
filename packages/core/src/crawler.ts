import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { chromium } from "playwright";
import type { Adapter, Document } from "./schema";
import { hash } from "./serialize";

const AGENT = "CryptoCardsBot";
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.replace(/\s+/g, " ").trim())
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
  accept = "text/html,text/plain,application/pdf",
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
      throw new Error(
        `HTTP ${r.status}${r.status === 429 ? " (rate limited; retry later)" : ""}`,
      );
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
export function documentFromText(
  url: string,
  text: string,
  title = url,
  links: string[] = [],
): Document {
  const content = normalize(text);
  const blocks = content
    .split("\n")
    .map((text) => ({ id: hash(text).slice(0, 24), text }));
  return {
    url,
    title,
    content,
    hash: hash({ url, content }),
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
  $("table").each((_, table) => {
    const rows = $(table)
      .find("tr")
      .map((_, tr) =>
        $(tr)
          .find("th,td")
          .map((_, td) => normalize($(td).text()).replaceAll("\n", " "))
          .get()
          .join(" | "),
      )
      .get();
    $(table).replaceWith(`\n${rows.join("\n")}\n`);
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
              "text/plain",
            );
            return robotsParser(`${u.origin}/robots.txt`, r.bytes.toString());
          } catch (e) {
            if (e instanceof Error && /^HTTP 404/.test(e.message))
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
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const parsed = await task.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= parsed.numPages; i++) {
      const page = await parsed.getPage(i);
      const content = await page.getTextContent();
      let line = "",
        y: number | undefined;
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
      pages.push(lines.join("\n"));
    }
    const doc = documentFromText(url, pages.join("\n"));
    return doc.content.length < 30
      ? {
          ...doc,
          status: "pending_transcription",
          error: "PDF has no usable text; transcription required",
        }
      : doc;
  } finally {
    await task.destroy();
  }
}
