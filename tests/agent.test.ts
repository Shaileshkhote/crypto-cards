import { afterEach, it, expect, vi } from "vitest";
import { Budget, extract, fingerprint, modelName, RunError } from "@cards/core/agent";
import { syncAdapter } from "@cards/core/sync";
import { adapter, extraction } from "./helpers";
import { documentFromText } from "@cards/core/crawler";
// Wire-format tests return one fee, so their source fixture contains that complete inventory.
const document = () => documentFromText("https://example.com/fees", "Core FX fee: 1.5% for residents of Germany.");
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("corrects an output-limit response within the existing bound without accepting partial JSON", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc);
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const body = JSON.parse(String(init?.body));
    expect(body.max_tokens).toBe(24000);
    expect(body.response_format.json_schema.schema.$defs.sourceUrl.enum).toEqual([doc.url]);
    if (++calls === 2) expect(body.messages.at(-1).content).toContain("response reached the output limit");
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: calls === 1 ? "length" : "stop", message: { content: calls === 1 ? '{"complete":true,"facts":[' : JSON.stringify(good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("supplies the complete financial inventory including late limits and explicit free charges", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", Array.from({ length: 7 }, (_, i) => `FX fee ${i}: 1.5%.`).join("\n") + "\nDaily spending limit: 10,000 USD.\nMonthly fee: none.\nNo withdrawal limits.\nAnnual fee: 0.\nAt most 3 ATM withdrawals per day.");
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const excerpts = JSON.parse(JSON.parse(String(init?.body)).messages[1].content).excerpts;
    expect(excerpts[0].blocks).toHaveLength(12);
    expect(excerpts[0].blocks.some((b: { text: string }) => b.text.includes("10,000 USD"))).toBe(true);
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: doc.blocks.map(block => ({ productId: "card", tierId: null, inherit: false, field: "terms", value: [block.text], evidence: { url: doc.url, blockId: block.id, quote: block.text } })) }) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toBeDefined();
});
it.each(["schema", "citation", "currency", "target"])("reports omitted financial blocks together with a %s failure in the first correction", async (failure) => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "Core FX fee: 1.5% for residents of Germany.\nAnnual fee: USD 20 per year.\nMonthly fee: USD 2 per month.\nCross-border fee: 0%.");
  const good = extraction(doc);
  for (const [index, rule] of [
    { id: "annual", kind: "annual", calculation: "fixed", fixed: { amount: "20", currency: "USD" }, scope: {}, calculable: true },
    { id: "monthly", kind: "monthly", calculation: "fixed", fixed: { amount: "2", currency: "USD" }, scope: {}, calculable: true },
    { id: "border", kind: "cross_border", calculation: "percentage", ratePercent: 0, scope: {}, calculable: true },
  ].entries()) good.facts.push({ ...good.facts[0], value: [rule], evidence: { url: doc.url, blockId: doc.blocks[index + 1].id, quote: doc.blocks[index + 1].text } } as typeof good.facts[number]);
  const broken = JSON.parse(JSON.stringify({ ...good, facts: good.facts.slice(0, 1) }));
  const fee = broken.facts[0].value[0];
  if (failure === "schema") delete fee.scope;
  if (failure === "citation") { fee.kind = "monthly"; fee.ratePercent = 0; }
  if (failure === "currency") { fee.calculation = "fixed"; fee.fixed = { amount: "1.5", currency: "USD" }; delete fee.ratePercent; }
  if (failure === "target") broken.facts[0].tierId = "undeclared-plan";
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("Uncovered financial");
      expect(feedback).toContain("Complete citation checklist");
      expect(feedback).toContain('"p1b1"');
      expect(feedback).toContain("Annual fee: USD 20 per year.");
      expect(feedback).toContain('"p1b4"');
      expect(feedback).toContain(({ schema: "explicit scope object", citation: "Period month", currency: "Money currency USD", target: "Unknown fact tier" })[failure]);
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? broken : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("allows a fourth complete draft within the unchanged twelve-turn limit", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), bad = structuredClone(good);
  (bad.facts[0].value as { ratePercent: number }[])[0].ratePercent = 99;
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(++calls < 4 ? bad : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(4);
});
it("copies the selected source block even when a response supplies a stale quote", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), wire = structuredClone(good);
  wire.facts[0].evidence = { url: doc.url, blockId: "p1b1", quote: "An unrelated previous table row." };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] })));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
});
it("rejects an invented amount even when the response puts it in its own quote", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), wire = extraction(doc, 99);
  wire.facts[0].evidence = { url: doc.url, blockId: "p1b1", quote: "Core FX fee: 99% for residents of Germany." };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] })));
  await expect(extract(adapter(), [doc], new Budget(0))).rejects.toThrow("Financial value 99 is absent");
});
it("shows possible source rows for an invalid financial citation without changing the claim", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "Core FX fee: 1.5% for residents of Germany.\nAnnual fee: USD 20 per year.");
  const good = extraction(doc);
  good.facts.push({ ...good.facts[0], field: "fees", value: [{ id: "annual", kind: "annual", calculation: "fixed", fixed: { amount: "20", currency: "USD" }, scope: {}, calculable: true }], evidence: { url: doc.url, blockId: doc.blocks[1].id, quote: doc.blocks[1].text } });
  const bad = structuredClone(good);
  bad.facts[0].evidence = { ...bad.facts[1].evidence };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("Financial value 1.5 is absent");
      expect(feedback).toContain("Possible source blocks for invalid financial rules");
      expect(feedback).toContain('"blockId":"p1b1"');
      expect(feedback).toContain("not verified replacement citations");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("updates the source URL enum after discovering another allowed page", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(); a.config.discovery = true;
  const initial = document(), discovered = documentFromText("https://example.com/more-fees", "Core FX fee: 1.5% for residents of Germany.");
  const combined = { ...extraction(initial), facts: [...extraction(initial).facts, ...extraction(discovered).facts] };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const body = JSON.parse(String(init?.body));
    expect(body.response_format.json_schema.schema.$defs.sourceUrl.enum).toEqual(++calls === 1 ? [initial.url] : [initial.url, discovered.url]);
    const message = calls === 1
      ? { content: null, tool_calls: [{ id: "discover", function: { name: "readPage", arguments: JSON.stringify({ url: discovered.url, offset: 0 }) } }] }
      : { content: JSON.stringify(combined) };
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: calls === 1 ? "tool_calls" : "stop", message }] });
  }));
  const discover = vi.fn(async () => discovered);
  const result = await extract(a, [initial], new Budget(0), discover);
  expect(result.documents).toHaveLength(2);
  expect(discover).toHaveBeenCalledWith(discovered.url);
  expect(calls).toBe(2);
});
it("shows the exact page URL for a mistyped source selector and still requires a corrected response", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = document(), good = extraction(doc), bad = structuredClone(good);
  bad.facts[0].evidence = { url: "https://example.com/fees%20wrong", blockId: "p1b1", quote: doc.blocks[0].text };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("Unknown source reference");
      expect(feedback).toContain(`exact evidence.url ${JSON.stringify(doc.url)}`);
      expect(feedback).toContain("not accepted automatically");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("corrects count-limit collisions by the sourced service without choosing or dropping either count", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "Daily limits: at most 15 card transactions per day and 3 ATM withdrawals per day.");
  const good = extraction(doc);
  good.facts[0] = { ...good.facts[0], field: "limits", value: [
    { id: "purchases", kind: "transaction_count", count: 15, period: "day", calculable: true, scope: { conditions: ["Card transactions"] } },
    { id: "atm", kind: "transaction_count", count: 3, period: "day", calculable: true, scope: { conditions: ["ATM withdrawals"] } },
  ] };
  const bad = structuredClone(good);
  for (const rule of bad.facts[0].value as { scope: Record<string, unknown> }[]) rule.scope = {};
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("Ambiguous limits identity");
      expect(feedback).toContain("source-named service");
      expect(feedback).toContain("Never invent a condition");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  await expect(extract(adapter(), [doc], new Budget(0))).resolves.toMatchObject({ extraction: good });
  expect(calls).toBe(2);
});
it("requires each explicit eligibility list before finishing a multi-source country extraction", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter();
  const docs = [documentFromText(a.sources.urls[0], "Users from the following countries are eligible to apply: Singapore."), documentFromText("https://example.com/other", "Users from the following countries are eligible to apply: Japan.")];
  a.sources.urls = docs.map(doc => doc.url);
  const facts = docs.map((doc, i) => ({ productId: "card", tierId: null, inherit: false, field: "residentCountries", value: i ? ["JP"] : ["SG"], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text } }));
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain('"p2b1"');
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: calls === 1 ? facts.slice(0, 1) : facts }) } }] });
  }));
  const result = await extract(a, docs, new Budget(0));
  expect(calls).toBe(2);
  expect(result.extraction.facts).toHaveLength(2);
  expect(result.extraction.facts.every(f => f.field === "terms")).toBe(true);
});
it("requires the omitted competing financial block, then preserves both claims without selecting a price", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter();
  const docs = [documentFromText(a.sources.urls[0], "ATM withdrawal limit: USD 500 per withdrawal."), documentFromText("https://example.com/overview", "ATM withdrawal limit: USD 250 per withdrawal.")];
  a.sources.urls = docs.map(d => d.url);
  const facts = docs.map((doc, i) => ({ productId: "card", tierId: null, inherit: false, field: "limits", value: [{ id: "atm", kind: "atm", scope: {}, amount: { amount: i ? "250" : "500", currency: "USD" }, period: "transaction", calculable: true }], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text } }));
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain('"p2b1"');
      expect(feedback).toContain("ATM withdrawal limit: USD 250 per withdrawal.");
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: calls === 1 ? facts.slice(0, 1) : facts }) } }] });
  }));
  const result = await extract(a, docs, new Budget(0));
  expect(calls).toBe(2);
  expect(result.issues.some(issue => issue.includes("Conflicting source claims"))).toBe(true);
  expect(result.extraction.facts).toHaveLength(2);
  expect(result.extraction.facts.every(fact => fact.field === "terms")).toBe(true);
  expect(result.extraction.facts.map(fact => fact.evidence.url)).toEqual(docs.map(doc => doc.url));
});
it("retains the sourced ATM clause in FX collision feedback so the model can correct the actual service scope", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "Purchase FX: 1% on non-USD payments. ATM withdrawals in a currency other than USD add an FX fee of $0.30 plus 1%.");
  const wire = extraction(doc);
  const clause = "ATM withdrawals in a currency other than USD add an FX fee of $0.30 plus 1%.";
  wire.facts[0].value = [
    { id: "purchase-fx", kind: "fx", calculation: "percentage", ratePercent: 1, calculable: true, scope: { excludedTransactionCurrencies: ["USD"] } },
    { id: "atm-fx", kind: "fx", calculation: "unknown", calculable: false, description: clause, scope: { excludedTransactionCurrencies: ["USD"] } },
  ];
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain(clause);
      expect(feedback).toContain("ATM withdrawals versus card purchases");
      (wire.facts[0].value as { scope: Record<string, unknown> }[])[1].scope.conditions = ["ATM withdrawals"];
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(wire) } }] });
  }));
  const result = await extract(adapter(), [doc], new Budget(0));
  expect(calls).toBe(2);
  expect((result.extraction.facts[0].value as { description?: string; scope: Record<string, unknown> }[])[1]).toMatchObject({ description: clause, scope: { conditions: ["ATM withdrawals"] } });
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
  const a = adapter(), doc = documentFromText("https://example.com/fees", "Support contact information updated.");
  a.sources.urls.push("https://example.com/unchanged");
  const empty = { complete: true, products: [], tiers: [], facts: [] };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(empty) } }] })));
  await expect(extract(a, [doc], new Budget(0))).resolves.toMatchObject({ extraction: empty });
});
it("rejects omitted financial claims in a changed source even when other sources are cached", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(), doc = document();
  a.sources.urls.push("https://example.com/unchanged");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/models")
    ? Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] })
    : Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [] }) } }] })));
  await expect(extract(a, [doc], new Budget(0))).rejects.toThrow("Uncovered financial");
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
            supported_parameters: ["tools", "structured_outputs", "reasoning"],
          },
        ],
      });
    requests++;
    const body = JSON.parse(String(init?.body));
    expect(JSON.parse(body.messages[1].content).sourceHints.map((hint: { url: string }) => hint.url)).toEqual([doc.url]);
    expect(
      body.tools.map((x: { function: { name: string } }) => x.function.name),
    ).toEqual(["listPages", "searchDocs", "readPage"]);
    expect(body.tool_choice).toBe(requests === 12 ? "none" : "auto");
    expect(body.reasoning).toEqual({ effort: "low", exclude: true });
    expect(body.max_tokens).toBe(24_000);
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
  requests = 0;
  wireExtraction.facts[0].evidence.url = "not-a-url";
  await expect(extract(a, [doc], new Budget())).rejects.toThrow(
    "Invalid url",
  );
  expect(requests).toBe(12);
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
      expect(result.find((p: { url: string }) => p.url === last.url).blocks[0]).toMatchObject({ id: "p2b1", alreadyRead: true });
      expect(JSON.parse(body.messages[1].content).excerpts.find((p: { url: string }) => p.url === last.url).blocks[0].text).toContain("Example Bank");
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
  const docs = Array.from({ length: 20 }, (_, i) => documentFromText(`https://example.com/fees-${i}`, `Introduction.\nContents.\nProcedure clause ${i}: ${"A detailed procedure condition applies. ".repeat(35)}`));
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
    if (turn === 3) expect(JSON.parse(body.messages.at(-1).content).blocks[0].text).toBe(docs[0].blocks[2].text);
    if (turn === 4) {
      const page = JSON.parse(body.messages.at(-1).content);
      expect(page.blocks[0]).toEqual({ id: "p1b3", alreadyRead: true });
      expect(page.nextOffset).toBeNull();
    }
    const tools = turn === 1
      ? Array.from({ length: 32 }, (_, i) => ({ id: `search-${i}`, function: { name: "searchDocs", arguments: '{"query":"procedure"}' } }))
      : [{ id: `read-${turn}`, function: { name: "readPage", arguments: JSON.stringify({ url: docs[0].url, offset: 2 }) } }];
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: turn < 4 ? "tool_calls" : "stop", message: turn < 4 ? { content: null, tool_calls: tools } : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [] }) } }] });
  }));
  await expect(extract(adapter(), docs, new Budget(0))).resolves.toBeDefined();
  expect(calls).toBe(4);
});

it("shows late search matches and different excerpts from the same block without hiding the full source", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const text = `${"Legal introduction. ".repeat(35)}Photo format: a color image. ${"Other conditions. ".repeat(35)}Document translation: certified copy.`;
  const doc = documentFromText("https://example.com/fees", `Introduction.\nContents.\n${text}`, "Requirements");
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    const turn = ++calls, body = JSON.parse(String(init?.body));
    if (turn === 2 || turn === 3) {
      const block = JSON.parse(body.messages.at(-1).content)[0].blocks[0];
      expect(block.text).toContain(turn === 2 ? "Photo format: a color image" : "Document translation: certified copy");
      expect(block).toMatchObject({ id: "p1b3", offset: 2, truncated: true });
      expect(block.alreadyRead).toBeUndefined();
    }
    if (turn === 4) expect(JSON.parse(body.messages.at(-1).content).blocks[0].text).toBe(text);
    const tool = turn < 3 ? { name: "searchDocs", arguments: JSON.stringify({ query: turn === 1 ? "Photo format" : "Document translation" }) }
      : { name: "readPage", arguments: JSON.stringify({ url: doc.url, offset: 2 }) };
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: turn < 4 ? "tool_calls" : "stop", message: turn < 4
      ? { content: null, tool_calls: [{ id: `tool-${turn}`, function: tool }] }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [{ productId: "card", tierId: null, inherit: false, field: "requirements", value: ["Use a color photo and a certified document translation."], evidence: { url: doc.url, blockId: doc.blocks[2].id, quote: doc.blocks[2].text } }] }) } }] });
  }));
  await extract(adapter(), [doc], new Budget(0));
  expect(calls).toBe(4);
});

it("exposes a later numeric ATM limit instead of only the first two marketing matches", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "offline-fixture-not-a-key");
  const doc = documentFromText("https://example.com/card", "Withdraw from supported ATMs.\nAccess cash at ATMs worldwide.\nATM access is convenient.\nATM cash is available worldwide.\nUse your card at an ATM.\n3. ATM Withdrawal Limits (Physical Card Only)\nCall the toll-free number 1-888-824-8817 to activate the card. Consult the fee schedule.\nATM withdrawals are capped at $250 per withdrawal.");
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 1) {
      const preview = JSON.parse(JSON.parse(String(init?.body)).messages[1].content).excerpts[0];
      expect(preview.blocks[0]).toMatchObject({ id: "p1b8", text: "ATM withdrawals are capped at $250 per withdrawal." });
    }
    if (calls === 2) {
      const page = JSON.parse(JSON.parse(String(init?.body)).messages.at(-1).content)[0];
      expect(page.totalMatches).toBe(7);
      expect(page.blocks[0]).toEqual({ id: "p1b8", alreadyRead: true });
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: calls === 1 ? "tool_calls" : "stop", message: calls === 1
      ? { content: null, tool_calls: [{ id: "atm", function: { name: "searchDocs", arguments: '{"query":"ATM"}' } }] }
      : { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: [{ ...extraction(doc).facts[0], field: "terms", value: [doc.blocks[7].text], evidence: { url: doc.url, blockId: "p1b8" } }] }) } }] });
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
      expect(JSON.parse(source.content).blocks[0]).toEqual({ id: "p1b1", alreadyRead: true });
      expect(JSON.parse(body.messages[1].content).excerpts[0].blocks[0].text).toBe(doc.blocks[0].text);
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

it("returns actionable crypto-currency feedback without treating a stablecoin as fiat money", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "A 2% crypto conversion fee applies when funding with USDT.");
  const good = extraction(doc);
  good.facts[0].value = [{ id: "conversion", kind: "conversion", calculation: "percentage", ratePercent: 2, calculable: true, scope: { conditions: ["Funding with USDT"] } }];
  const bad = structuredClone(good);
  (bad.facts[0].value as { scope: Record<string, unknown> }[])[0].scope = { fundingCurrencies: ["USDT"] };
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      const feedback = JSON.parse(String(init?.body)).messages.at(-1).content;
      expect(feedback).toContain("scope.conditions");
      expect(feedback).toContain("never be relabeled USD");
      expect(feedback).not.toContain('"AED","AFN"');
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  expect((await extract(adapter(), [doc], new Budget(0))).extraction).toEqual(good);
  expect(calls).toBe(2);
});

it("requires source-named assetback rewards instead of overlooking them as non-financial text", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(), fees = documentFromText("https://example.com/fees", "Core FX fee: 1.5%."), rewards = documentFromText("https://example.com/rewards", "New users receive 3% assetback on eligible card purchases.");
  a.sources.urls = [fees.url, rewards.url];
  const good = extraction(fees);
  good.facts.push({ ...good.facts[0], field: "rewards", value: [{ id: "assetback", kind: "cashback", ratePercent: 3, calculable: true, scope: { conditions: ["New users; eligible card purchases"] } }], evidence: { url: rewards.url, blockId: rewards.blocks[0].id, quote: rewards.blocks[0].text } });
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain(rewards.blocks[0].text);
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? { ...good, facts: good.facts.slice(0, 1) } : good) } }] });
  }));
  expect((await extract(a, [fees, rewards], new Budget(0))).extraction.facts).toHaveLength(2);
  expect(calls).toBe(2);
});

it("requires authoritative financial clauses in the full input and before accepting a lower-priority price", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(), pricing = documentFromText("https://example.com/fees", "Non-USD FX fee: 1%."), authority = documentFromText("https://example.com/card-terms", Array.from({ length: 6 }, (_, i) => `Legal liability limit: USD ${100 + i}.`).join("\n") + "\nNon-USD foreign exchange fee: 2.2%.");
  a.sources.urls = [pricing.url, authority.url];
  a.sources.metadata = [{ url: authority.url, productIds: ["card"], supersedes: [pricing.url] }];
  const good = extraction(pricing);
  good.facts[0].value = [{ id: "fx", kind: "fx", calculation: "percentage", ratePercent: 1, calculable: true, scope: { excludedTransactionCurrencies: ["USD"] } }];
  for (const block of authority.blocks.slice(0, -1)) good.facts.push({ ...good.facts[0], field: "terms", value: [block.text], evidence: { url: authority.url, blockId: block.id, quote: block.text } });
  const previous = structuredClone(good);
  const block = authority.blocks.at(-1)!;
  good.facts.push({ ...good.facts[0], value: [{ id: "fx", kind: "fx", calculation: "percentage", ratePercent: 2.2, calculable: true, scope: { excludedTransactionCurrencies: ["USD"] } }], evidence: { url: authority.url, blockId: block.id, quote: block.text } });
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain(block.text);
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(calls === 1 ? previous : good) } }] });
  }));
  const result = await extract(a, [pricing, authority], new Budget(0));
  expect(calls).toBe(2);
  expect(result.extraction.facts.filter(f => f.field === "fees").flatMap(f => f.value as { ratePercent?: number }[]).map(f => f.ratePercent)).toEqual([2.2]);
  expect(result.extraction.facts.some(f => f.field === "terms" && f.evidence.url === pricing.url)).toBe(true);
});

it("requires complete coverage when the adapter has only one configured source", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const doc = documentFromText("https://example.com/fees", "Monthly fee: free.\nAnnual fee: free.");
  const a = adapter();
  const facts = doc.blocks.map((block, i) => ({ productId: "card", tierId: null, inherit: false, field: "fees", value: [{ id: i ? "annual" : "monthly", kind: i ? "annual" : "monthly", calculation: "percentage", ratePercent: 0, scope: {} }], evidence: { url: doc.url, blockId: block.id, quote: block.text } }));
  let calls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain("Annual fee: free.");
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts: calls === 1 ? facts.slice(0, 1) : facts }) } }] });
  }));
  expect((await extract(a, [doc], new Budget(0))).extraction.facts).toHaveLength(2);
  expect(calls).toBe(2);
});

it("accepts a short clause covered verbatim by a richer same-page citation, but still requires independent pages", async () => {
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-not-a-real-key");
  const a = adapter(), one = documentFromText("https://example.com/fees", "ATM fee: $5\nATM fee: $5 per withdrawal."), other = documentFromText("https://example.com/other", "ATM fee: $5");
  const fact = (doc: typeof one, index: number) => ({ productId: "card", tierId: null, inherit: false, field: "fees", value: [{ id: "atm", kind: "atm", calculation: "fixed", fixed: { amount: "5", currency: "USD" }, scope: {} }], evidence: { url: doc.url, blockId: doc.blocks[index].id, quote: doc.blocks[index].text } });
  let calls = 0, secondPage = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/models")) return Response.json({ data: [{ id: modelName(), pricing: { prompt: "0", completion: "0" }, supported_parameters: ["tools", "structured_outputs"] }] });
    if (++calls === 2) {
      expect(secondPage).toBe(true);
      expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain(other.url);
    }
    const facts = [fact(one, 1), ...(secondPage && calls > 1 ? [fact(other, 0)] : [])];
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ complete: true, products: [], tiers: [], facts }) } }] });
  }));
  expect((await extract(a, [one], new Budget(0))).extraction.facts).toHaveLength(1);
  expect(calls).toBe(1);
  calls = 0; secondPage = true; a.sources.urls.push(other.url);
  expect((await extract(a, [one, other], new Budget(0))).extraction.facts).toHaveLength(2);
  expect(calls).toBe(2);
});
