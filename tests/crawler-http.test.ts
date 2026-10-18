import { afterEach, expect, it, vi } from "vitest";
import { Crawler } from "@cards/core/crawler";
import { adapter } from "./helpers";
vi.mock("node:dns/promises", () => ({
  lookup: async () => [{ address: "93.184.216.34", family: 4 }],
}));
afterEach(() => vi.unstubAllGlobals());

it.each([403, 404, 406])("handles an unavailable robots file (%s) using RFC 9309", async status => {
  const requests = vi.fn(async (url: string, init?: RequestInit) => {
    expect(new Headers(init?.headers).get("Accept")).toBe("*/*");
    return url.endsWith("/robots.txt")
      ? new Response("", { status })
      : new Response("Public fee schedule: monthly fee is 0 EUR.", { headers: { "content-type": "text/plain" } });
  });
  vi.stubGlobal("fetch", requests);
  expect((await new Crawler(adapter()).fetch("https://example.com/fees")).status).toBe("ok");
  expect(requests).toHaveBeenCalledTimes(2);
});
it.each([429, 500, 503])("retains the failure when robots access is transiently unavailable (%s)", async status => {
  const requests = vi.fn(async () => new Response("", { status }));
  vi.stubGlobal("fetch", requests);
  expect((await new Crawler(adapter()).fetch("https://example.com/fees")).status).toBe("unavailable");
  expect(requests).toHaveBeenCalledTimes(1);
});
it("respects an explicit robots disallow", async () => {
  const requests = vi.fn(async () => new Response("User-agent: *\nDisallow: /"));
  vi.stubGlobal("fetch", requests);
  const result = await new Crawler(adapter()).fetch("https://example.com/fees");
  expect(result.error).toContain("Disallowed by robots.txt");
  expect(requests).toHaveBeenCalledTimes(1);
});
