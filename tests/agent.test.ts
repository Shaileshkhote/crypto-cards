import { afterEach, it, expect, vi } from "vitest";
import { Budget, extract } from "@cards/core/agent";
import { adapter, document, extraction } from "./helpers";
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
            id: "openai/gpt-4.1-mini",
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
      '"pattern":"^[A-Z]{2}$"',
    );
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
it("retains a conservative charge when a paid response has invalid JSON", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) =>
      input.endsWith("/models")
        ? Response.json({
            data: [
              {
                id: "openai/gpt-4.1-mini",
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
