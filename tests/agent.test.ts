import { afterEach, it, expect, vi } from "vitest";
import { Budget, extract, fingerprint, modelName, RunError } from "@cards/core/agent";
import { syncAdapter } from "@cards/core/sync";
import { adapter, document, extraction } from "./helpers";
import { documentFromText } from "@cards/core/crawler";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("corrects an empty full-inventory response instead of accepting complete with no facts", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc);
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain("Empty full-inventory extraction");
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? { complete: true, products: [], tiers: [], facts: [] } : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("allows an empty changed-source result when other configured sources remain outside the invocation", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(), doc = document();
  a.sources.urls.push("https://example.com/unchanged");
  const empty = { complete: true, products: [], tiers: [], facts: [] };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(empty) } }] })));
  await expect(extract(a, [doc], new Budget(0))).resolves.toMatchObject({ extraction: empty });
});
it("skips retired adapters before any database, fetch or model work even when forced", async () => {
  const a = adapter(), doc = document(), before = fingerprint(doc, a);
  const fetch = vi.fn(), extractor = vi.fn();
  vi.stubGlobal("fetch", fetch);
  a.config.retired = true;
  expect(fingerprint(doc, a)).toBe(before);
  const budget = new Budget(0);
  expect(await syncAdapter(a, budget, { force: true, fetch, extract: extractor })).toMatchObject({ status: "retired", changed: 0, costUsd: 0 });
  await expect(extract(a, [doc], budget)).rejects.toThrow("Adapter is retired");
  expect(fetch).not.toHaveBeenCalled();
  expect(extractor).not.toHaveBeenCalled();
  expect(budget.requests).toBe(0);
  a.config.retired = false;
  expect(fingerprint(doc, a)).toBe(before);
});
it("shares a conservative request budget across adapters", () => {
  const b = new Budget(4.99);
  b.reserve(3);
  expect(() => b.reserve(3)).toThrow("Budget exhausted");
  b.settle(3, 2, 100, 20);
  b.reserve(2.99);
  b.settle(2.99, 2);
  expect(b.spent).toBe(4);
  expect(() => b.reserve(2)).toThrow();
  expect(new Budget(25).max).toBe(4.99);
  expect(() => new Budget(-1)).toThrow("Invalid MAX_RUN_COST_USD");
  expect(() => new Budget(Number.NaN)).toThrow("Invalid MAX_RUN_COST_USD");
});
it("runs one three-tool loop and validates its final evidence", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document();
  const a = adapter();
  a.sources.metadata = [{ url: doc.url, productIds: ["card"] }, { url: "https://example.com/unchanged", productIds: ["card"] }];
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
    expect(JSON.parse(body.messages[1].content).sourceHints.map((hint: { url: string }) => hint.url)).toEqual([doc.url]);
    expect(
      body.tools.map((x: { function: { name: string } }) => x.function.name),
    ).toEqual(["listPages", "searchDocs", "readPage"]);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(false);
    const schema = body.response_format.json_schema.schema;
    // A live OpenAI route rejects this unsupported format before generation.
    expect(JSON.stringify(schema)).not.toContain(
      '"format":"uri"',
    );
    expect(JSON.stringify(schema)).toContain(
      '"GB"',
    );
    let enumValues = 0;
    let unions = 0;
    const checkSchema = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      const obj = value as Record<string, unknown>;
      if (typeof obj.$ref === "string") {
        const target = obj.$ref.slice(2).split("/").reduce((node: Record<string, unknown>, key: string) => node[key] as Record<string, unknown>, schema);
        expect(target).toBeDefined();
      }
      if (Array.isArray(obj.enum)) enumValues += obj.enum.length;
      if (Array.isArray(obj.anyOf) || Array.isArray(obj.type)) unions++;
      Object.values(obj).forEach(checkSchema);
    };
    checkSchema(schema);
    expect(enumValues).toBeLessThan(1000);
    expect(unions).toBeLessThanOrEqual(16);
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
  const r = await extract(a, [doc], b);
  expect(r.extraction.facts).toHaveLength(2);
  expect((r.extraction.facts[0].value as Record<string, unknown>[])[0].scope).toEqual({
    residentCountries: null, transactionCountries: [],
  });
  expect(r.extraction.facts[1].value).toBeNull();
  expect(b.requests).toBe(2);
  expect(b.spent).toBe(0.0002);
  // Removing the provider's URI hint must not relax runtime URL validation.
  wireExtraction.facts[0].evidence.url = "not-a-url";
  await expect(extract(a, [doc], new Budget())).rejects.toThrow(
    "Invalid url",
  );
});
it("does not send a paid request without a key", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "");
  await expect(extract(adapter(), [document()], new Budget())).rejects.toThrow(
    "OPENROUTER_API_KEY",
  );
});
it("derives redundant fee flags and retains source text for uncertain rewards", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "FX fee: 1.5%. Referral rewards depend on eligibility.");
  const wire = extraction(doc);
  delete (wire.facts[0].value as Record<string, unknown>[])[0].calculable;
  (wire.facts as unknown[]).push({ ...wire.facts[0], field: "rewards", value: [{ id: "referral", scope: {} }] });
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] })));
  const result = await extract(adapter(), [doc], new Budget());
  expect((result.extraction.facts[0].value as Record<string, unknown>[])[0].calculable).toBe(true);
  expect((result.extraction.facts[1].value as Record<string, unknown>[])[0]).toMatchObject({ calculable: false, description: doc.blocks[0].text });
});
it("retains an unsupported compound formula as source text without publishing a guessed calculation", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "ATM fee: $1 plus 0.65% per withdrawal."), wire = extraction(doc);
  (wire.facts[0] as { value: unknown }).value = [{ id: "atm", kind: "atm", scope: {}, calculation: "fixed_plus_percentage", fixed: { amount: "99", currency: "USD" }, ratePercent: 99, calculable: true }];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] })));
  const result = await extract(adapter(), [doc], new Budget());
  const rule = (result.extraction.facts[0].value as Record<string, unknown>[])[0];
  expect(rule).toMatchObject({ calculation: "unknown", calculable: false, description: doc.blocks[0].text });
  expect(rule).not.toHaveProperty("fixed");
  expect(rule).not.toHaveProperty("ratePercent");
});
it("stops invalid model requests with a useful diagnostic and redacts credentials", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-private-model-key");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ error: { message: "Provider returned error", metadata: { raw: JSON.stringify({ error: { message: "Unsupported schema: fixture-private-model-key" } }) } } }, { status: 400 })));
  try { await extract(adapter(), [document()], new Budget()); throw new Error("Expected request failure"); }
  catch (error) {
    expect(error).toBeInstanceOf(RunError);
    expect((error as Error).message).toContain("Unsupported schema: [redacted]");
    expect((error as Error).message).not.toContain("fixture-private-model-key");
  }
});
it("reserves tiered model prices before sending any paid request", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const mocked = vi.fn(async () => Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001", overrides: [{ completion: "0.001" }] }, supported_parameters: ["tools", "structured_outputs"] }] }));
  vi.stubGlobal("fetch", mocked);
  await expect(extract(adapter(), [document()], new Budget())).rejects.toThrow("Budget exhausted");
  expect(mocked).toHaveBeenCalledTimes(1); // Catalog only; no paid completion.
});
it("excludes unreachable context tiers while reserving advertised cache-write costs", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document();
  for (const cacheWrite of ["0.0000002", "0.001"]) {
    let paid = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001", input_cache_write: cacheWrite, overrides: [{ min_prompt_tokens: 1000000000, prompt: "1", completion: "1" }] }, supported_parameters: ["tools", "structured_outputs"] }] });
      paid++;
      return Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(extraction(doc)) } }] });
    }));
    const result = extract(adapter(), [doc], new Budget(0.1));
    if (cacheWrite === "0.001") { await expect(result).rejects.toThrow("Budget exhausted"); expect(paid).toBe(0); }
    else { await expect(result).resolves.toBeDefined(); expect(paid).toBe(1); }
  }
});
it("can finish a provider after reading multiple substantial pages", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const docs = Array.from({ length: 12 }, (_, i) => documentFromText(`https://example.com/page-${i}`, Array.from({ length: 35 }, (_, j) => `Clause ${j}: ${"Eligible card purchases and exclusions. ".repeat(15)}`).join("\n")));
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000004", completion: "0.0000016" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(Buffer.byteLength(String(init?.body))).toBeGreaterThan(256_000);
    return Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: calls === 1 ? "tool_calls" : "stop", message: calls === 1
      ? { content: null, tool_calls: docs.map((d, i) => ({ id: `read-${i}`, function: { name: "readPage", arguments: JSON.stringify({ url: d.url, offset: 0 }) } })) }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [] }) } }] });
  }));
  await expect(extract(adapter(), docs, new Budget())).resolves.toMatchObject({ extraction: { complete: true } });
  expect(calls).toBe(2);
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
it("reports the actual invalid rule instead of restoring optional nulls in a rejected union variant", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), bad = structuredClone(good);
  const rule = (bad.facts[0].value as Record<string, unknown>[])[0];
  rule.kind = "unsupported-fee";
  rule.scope = { residentCountries: null, regions: null, transactionCountries: null };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0.0000001", completion: "0.0000001" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("kind");
      expect(feedback).not.toContain("Expected array, received null");
    }
    return Response.json({ usage: { cost: 0.001 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget())).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("reuses prior tool text without hiding a full block behind its earlier excerpt", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const docs = Array.from({ length: 20 }, (_, i) => documentFromText(`https://example.com/fees-${i}`, `Fee clause ${i}: ${"A detailed fee condition applies. ".repeat(40)}`));
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    if (input.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const body = JSON.parse(String(init?.body));
    const turn = ++calls;
    if (turn === 2) {
      expect(Buffer.byteLength(String(init?.body))).toBeLessThan(220_000);
      const results = body.messages.filter((m: { role: string }) => m.role === "tool").map((m: { content: string }) => JSON.parse(m.content));
      expect(results.flat().some((p: { blocks: { alreadyRead?: boolean }[] }) => p.blocks.some(b => b.alreadyRead))).toBe(true);
      expect(new Set(results.flat().map((p: { url: string }) => p.url)).size).toBe(docs.length);
    }
    if (turn === 3) expect(JSON.parse(body.messages.at(-1).content).blocks[0].text).toBe(docs[0].blocks[0].text);
    if (turn === 4) {
      const page = JSON.parse(body.messages.at(-1).content);
      expect(page.blocks[0]).toEqual({ id: "p1b1", alreadyRead: true });
      expect(page.nextOffset).toBeNull();
    }
    const tools = turn === 1
      ? Array.from({ length: 32 }, (_, i) => ({ id: `search-${i}`, function: { name: "searchDocs", arguments: '{"query":"fee"}' } }))
      : [{ id: `read-${turn}`, function: { name: "readPage", arguments: JSON.stringify({ url: docs[0].url, offset: 0 }) } }];
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: turn < 4 ? "tool_calls" : "stop", message: turn < 4 ? { content: null, tool_calls: tools } : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [] }) } }] });
  }));
  await expect(extract(adapter(), docs, new Budget(0))).resolves.toBeDefined();
  expect(calls).toBe(4);
});

it("shows late search matches and different excerpts from the same block without hiding the full source", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const text = `${"Legal introduction. ".repeat(35)}Fast ACH: $1 plus 0.75%. ${"Other conditions. ".repeat(35)}Debit funding: 1.75%.`;
  const doc = documentFromText("https://example.com/fees", text, "Fees", [], true);
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const turn = ++calls, body = JSON.parse(String(init?.body));
    if (turn === 2 || turn === 3) {
      const block = JSON.parse(body.messages.at(-1).content)[0].blocks[0];
      expect(block.text).toContain(turn === 2 ? "Fast ACH: $1 plus 0.75%" : "Debit funding: 1.75%");
      expect(block).toMatchObject({ id: "p1b1", offset: 0, truncated: true });
      expect(block.alreadyRead).toBeUndefined();
    }
    if (turn === 4) expect(JSON.parse(body.messages.at(-1).content).blocks[0].text).toBe(text);
    const tool = turn < 3 ? { name: "searchDocs", arguments: JSON.stringify({ query: turn === 1 ? "Fast ACH" : "Debit funding" }) }
      : { name: "readPage", arguments: JSON.stringify({ url: doc.url, offset: 0 }) };
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: turn < 4 ? "tool_calls" : "stop", message: turn < 4
      ? { content: null, tool_calls: [{ id: `tool-${turn}`, function: tool }] }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [{ productId: "card", tierId: null, inherit: false, field: "fees", value: [{ id: "fast-ach", kind: "other", serviceId: "fast-ach", scope: { paymentRails: ["ach"], conditions: ["Fast ACH"] }, calculation: "unknown", calculable: false, description: "Fast ACH: $1 plus 0.75%." }], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text } }] }) } }] });
  }));
  await extract(adapter(), [doc], new Budget(0));
  expect(calls).toBe(4);
});

it("exposes a later numeric ATM limit instead of only the first two marketing matches", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const doc = documentFromText("https://example.com/card", "Withdraw from supported ATMs.\nAccess cash at ATMs worldwide.\nATM access is convenient.\nATM cash is available worldwide.\nUse your card at an ATM.\nATM withdrawals are capped at $250 per withdrawal.");
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 1) {
      const preview = JSON.parse(JSON.parse(String(init?.body)).messages[1].content).excerpts[0];
      expect(preview.blocks[0]).toMatchObject({ id: "p1b6", text: "ATM withdrawals are capped at $250 per withdrawal." });
    }
    if (calls === 2) {
      const page = JSON.parse(JSON.parse(String(init?.body)).messages.at(-1).content)[0];
      expect(page.totalMatches).toBe(6);
      expect(page.blocks[0]).toMatchObject({ id: "p1b6", offset: 5 });
      expect(page.blocks[0].text).toContain("$250 per withdrawal");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: calls === 1 ? "tool_calls" : "stop", message: calls === 1
      ? { content: null, tool_calls: [{ id: "atm", function: { name: "searchDocs", arguments: '{"query":"ATM"}' } }] }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [] }) } }] });
  }));
  await extract(adapter(), [doc], new Budget(0));
  expect(calls).toBe(2);
});

it("reports every missing financial scope in a single correction without assuming global applicability", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const doc = document(), good = extraction(doc);
  good.facts = Array.from({ length: 17 }, () => structuredClone(good.facts[0]));
  const bad = structuredClone(good);
  for (const fact of bad.facts) delete (fact.value as Record<string, unknown>[])[0].scope;
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      for (let i = 0; i < 17; i++) expect(feedback).toContain(JSON.stringify(["facts", i, "value", 0, "scope"]));
      expect(feedback).toContain("Do not assume a missing scope means global applicability");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  expect((await extract(adapter(), [doc], new Budget(0))).extraction).toEqual(good);
  expect(calls).toBe(2);
});

it("keeps sources and tool reasoning while replacing superseded drafts before corrections exhaust context", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const doc = document(), good = extraction(doc), bad = structuredClone(good);
  delete (bad.facts[0].value as Record<string, unknown>[])[0].scope;
  (bad.facts[0].value as Record<string, unknown>[])[0].description = "superseded draft " + "x".repeat(250_000);
  const corrected = structuredClone(good);
  Object.assign((corrected.facts[0].value as Record<string, unknown>[])[0], { ratePercent: 99, description: "current draft " + "y".repeat(250_000) });
  const toolReasoning = [{ type: "reasoning.encrypted", data: "tool-continuation-state" }];
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const turn = ++calls, body = JSON.parse(String(init?.body));
    if (turn === 3 || turn === 4) {
      const assistants = body.messages.filter((m: { role: string }) => m.role === "assistant");
      expect(assistants).toHaveLength(2);
      expect(assistants[0].reasoning_details).toEqual(toolReasoning);
      expect(assistants[1].content).toBe(JSON.stringify(turn === 3 ? bad : corrected));
      expect(assistants[1].reasoning_details).toBeUndefined();
      expect(body.messages.filter((m: { role: string; content?: string }) => m.role === "user" && m.content?.startsWith("Candidate validation failed:"))).toHaveLength(1);
      const source = body.messages.find((m: { role: string }) => m.role === "tool");
      expect(JSON.parse(source.content).blocks[0].text).toBe(doc.blocks[0].text);
      expect(Buffer.byteLength(String(init?.body))).toBeLessThan(512_000);
    }
    const message = turn === 1
      ? { content: null, tool_calls: [{ id: "read", function: { name: "readPage", arguments: JSON.stringify({ url: doc.url, offset: 0 }) } }], reasoning_details: toolReasoning }
      : { content: JSON.stringify(turn === 2 ? bad : turn === 3 ? corrected : good), reasoning_details: [{ type: "reasoning.encrypted", data: "x".repeat(520_000) }] };
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: turn === 1 ? "tool_calls" : "stop", message }] });
  }));
  expect((await extract(adapter(), [doc], new Budget(0))).extraction).toEqual(good);
  expect(calls).toBe(4);
});

it("reports unknown source URLs, malformed fields and wrong financial rows together with the model's source selectors", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const doc = documentFromText("https://example.com/fees", "FX fee: 1.5%.\nCollateral can be increased voluntarily.");
  const good = extraction(doc), bad = structuredClone(good);
  bad.facts[0].evidence = { url: doc.url, blockId: "p1b2" } as typeof bad.facts[0]["evidence"];
  bad.complete = false;
  for (const url of ["https://example.com/typo-one", "https://example.com/typo-two"])
    bad.facts.push({ ...good.facts[0], evidence: { url, blockId: "p1b1" } } as typeof bad.facts[number]);
  bad.facts.push({ ...good.facts[0], field: "residentCountries", value: [""] } as typeof bad.facts[number]);
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain(`${doc.url}#p1b2`);
      expect(feedback).toContain("Collateral can be increased voluntarily");
      expect(feedback).toContain("https://example.com/typo-one");
      expect(feedback).toContain("https://example.com/typo-two");
      expect(feedback).toContain("invalid_enum_value");
      expect(feedback).toContain("Agent marked extraction incomplete");
      expect(feedback).not.toContain(doc.blocks[1].id);
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  expect((await extract(adapter(), [doc], new Budget(0))).extraction).toEqual(good);
  expect(calls).toBe(2);
});

it("corrects a supplied non-verbatim quote using short selectors without echoing the bad quote", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), wire = structuredClone(good), bad = structuredClone(good);
  wire.facts[0].evidence = { url: doc.url, blockId: "p1b1" } as typeof good.facts[0]["evidence"];
  bad.facts[0].evidence = { url: doc.url, blockId: "p1b1", quote: "An invented non-verbatim quote." };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("p1b1");
      expect(feedback).toContain("omit quote");
      expect(feedback).not.toContain(doc.blocks[0].id);
      expect(feedback).not.toContain(bad.facts[0].evidence.quote);
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : wire) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
});

it("canonicalizes equivalent citation URLs while rejecting references to another host", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), wire = structuredClone(good);
  wire.facts[0].evidence = { url: doc.url.replace("example.com", "EXAMPLE.com") + "#pricing", blockId: "p1b1" } as typeof good.facts[0]["evidence"];
  const stub = (data: typeof wire) => vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    expect(JSON.parse(JSON.parse(String(init?.body)).messages[1].content).pages[0]).toMatchObject({ id: "p1", url: doc.url });
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(data) } }] });
  }));
  stub(wire);
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  wire.facts[0].evidence.url = "https://evil.example/fees";
  stub(wire);
  await expect(extract(adapter(), [doc], new Budget(0))).rejects.toThrow("Unknown source reference");
});
