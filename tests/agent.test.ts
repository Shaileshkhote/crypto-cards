import { afterEach, it, expect, vi } from "vitest";
import { Budget, extract, modelName } from "@cards/core/agent";
import { adapter, document, extraction } from "./helpers";
import { documentFromText } from "@cards/core/crawler";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("shares a conservative request budget across adapters", () => {
  const b = new Budget(5);
  b.reserve(3);
  expect(() => b.reserve(3)).toThrow("Budget exhausted");
  b.settle(3, 2, 100, 20);
  b.reserve(3);
  b.settle(3, 2);
  expect(b.spent).toBe(4);
  expect(() => b.reserve(2)).toThrow();
  expect(new Budget(100).max).toBe(5);
});
it("runs one three-tool loop and validates its final evidence", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document();
  const wireExtraction = extraction(doc);
  const fee = wireExtraction.facts[0].value as Record<string, unknown>[];
  fee[0].scope = {
    residentCountries: null,
    excludedResidentCountries: null,
    regions: null,
    transactionCountries: [],
  };
  wireExtraction.facts.push({
    inherit: false, productId: null, tierId: null, field: "regions",
    value: null, evidence: wireExtraction.facts[0].evidence,
  });
  let requests = 0;
  const mocked = vi.fn(async (input: string, init?: RequestInit) => {
    if (input.endsWith("/models"))
      return Response.json({
        data: [
          {
            id: modelName(),
            pricing: { prompt: "0.0000004", completion: "0.0000016" },
            supported_parameters: ["tools", "structured_outputs"],
          },
        ],
      });
    requests++;
    const body = JSON.parse(String(init?.body));
    expect(
      body.tools.map((x: { function: { name: string } }) => x.function.name),
    ).toEqual(["listPages", "searchDocs", "readPage"]);
    expect(body.response_format.json_schema.strict).toBe(true);
    // A live OpenAI route rejects this unsupported format before generation.
    expect(JSON.stringify(body.response_format.json_schema.schema)).not.toContain(
      '"format":"uri"',
    );
    expect(JSON.stringify(body.response_format.json_schema.schema)).toContain(
      '"GB"',
    );
    const schema = body.response_format.json_schema.schema;
    let enumValues = 0;
    const checkSchema = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const obj = value as Record<string, unknown>;
      if (typeof obj.$ref === "string") {
        const target = obj.$ref.slice(2).split("/").reduce((node: Record<string, unknown>, key: string) => node[key] as Record<string, unknown>, schema);
        expect(target).toBeDefined();
      }
      if (Array.isArray(obj.enum)) enumValues += obj.enum.length;
      Object.values(obj).forEach(checkSchema);
    };
    checkSchema(schema);
    expect(enumValues).toBeLessThan(1000);
    return Response.json({
      usage: { prompt_tokens: 50, completion_tokens: 20, cost: 0.0001 },
      choices: [
        requests === 1
          ? {
              finish_reason: "tool_calls",
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "tool",
                    function: {
                      name: "readPage",
                      arguments: JSON.stringify({ url: doc.url, offset: 0 }),
                    },
                  },
                ],
              },
            }
          : {
              finish_reason: "stop",
              message: { content: JSON.stringify(wireExtraction) },
            },
      ],
    });
  });
  vi.stubGlobal("fetch", mocked);
  const b = new Budget();
  const r = await extract(adapter(), [doc], b);
  expect(r.extraction.facts).toHaveLength(2);
  expect((r.extraction.facts[0].value as Record<string, unknown>[])[0].scope).toEqual({
    residentCountries: null, transactionCountries: [],
  });
  expect(r.extraction.facts[1].value).toBeNull();
  expect(b.requests).toBe(2);
  expect(b.spent).toBe(0.0002);
  // Removing the provider's URI hint must not relax runtime URL validation.
  wireExtraction.facts[0].evidence.url = "not-a-url";
  await expect(extract(adapter(), [doc], new Budget())).rejects.toThrow(
    "Invalid url",
  );
});
it("does not send a paid request without a key", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "");
  await expect(extract(adapter(), [document()], new Budget())).rejects.toThrow(
    "OPENROUTER_API_KEY",
  );
});
it("searches later sources even when a long first page contains many matches", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const first = documentFromText("https://example.com/legal", Array.from({ length: 60 }, (_, i) => `Fee section ${i}: conditions apply.`).join("\n"));
  const last = documentFromText("https://example.com/issuer", "Card issuer: Example Bank.");
  let requests = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000004", completion: "0.0000016" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const body = JSON.parse(String(init?.body));
    if (++requests === 2) {
      const result = JSON.parse(body.messages.at(-1).content);
      expect(result.find((p: { url: string }) => p.url === last.url).blocks[0].text).toContain("Example Bank");
    }
    return Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: requests === 1 ? "tool_calls" : "stop", message: requests === 1
      ? { content: null, tool_calls: [{ id: "search", function: { name: "searchDocs", arguments: '{"query":"fee issuer"}' } }] }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [{ field: "issuer", inherit: false, productId: null, tierId: null, value: { id: "example-bank", name: "Example Bank" }, evidence: { url: last.url, blockId: "p2b1" } }] }) } }] });
  }));
  const result = await extract(adapter(), [first, last], new Budget());
  expect(result.extraction.facts[0].evidence.url).toBe(last.url);
});
it("copies citations from selected source blocks instead of model-generated quotes", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document();
  const facts = extraction(doc).facts.map(f => ({ ...f, evidence: { url: doc.url, blockId: "p1b1" } }));
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000004", completion: "0.0000016" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts }) } }] })));
  const result = await extract(adapter(), [doc], new Budget());
  expect(result.extraction.facts[0].evidence).toEqual({
    url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text,
  });
});
it("retains a conservative charge when a paid response has invalid JSON", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) =>
      input.endsWith("/models")
        ? Response.json({
            data: [
              {
                id: modelName(),
                pricing: { prompt: "0.0000004", completion: "0.0000016" },
                supported_parameters: ["tools", "structured_outputs"],
              },
            ],
          })
        : new Response("invalid-json"),
    ),
  );
  const budget = new Budget();
  await expect(extract(adapter(), [document()], budget)).rejects.toThrow(
    "reservation retained",
  );
  expect(budget.spent).toBeGreaterThan(0);
  expect(budget.requests).toBe(1);
});
