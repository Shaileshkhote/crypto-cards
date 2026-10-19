# Extraction evaluation

The default model is `openai/gpt-6-luna` with **low reasoning when supported**, schema **8 / prompt 30**, merge **14**. Fresh paid requests passed **11/11 active labeled cases** for **$0.009983495** across 21 requests on 2026-10-19. All 14 original cases remain; one SafePal case and both Ready cases are skipped after retirement. These excerpts test individual interpretations, not whole-provider precision or recall. Production uses one selected model and no fallback chain.

Labels cover tier-specific issuance, contractual maximums, payment rails, non-USD FX/refunds, reward assets, PDF plan columns, money/count limits, cancellation/chargeback services, statement-copy prices, funding/ACH conditions, fee allowances and approximate partner charges. The final Picnic case requires the USD 200 monthly allowance in its typed field as well as the withdrawal-count condition. VaultLeap preserves approximate partner fees as unknown rules, with exact provider markup separately scoped.

Phantom's initial label incorrectly treated an ACH withdrawal as a normal card-purchase transaction. The label now uses a named uncommon service, consistent with the source and shared service classification. Its compound charge remains unknown rather than becoming two invented prices. The original failed report was retained; extracted amounts were not edited to pass the evaluation.

The earlier schema-7/prompt-21 high-reasoning profile passed 10/11 cases. A fresh full-provider high-reasoning attempt under prompt 25 consumed all 24,000 completion tokens on reasoning without producing JSON. It was stopped, with unknown in-flight reservations retained. Medium reasoning completed earlier inventory diagnostics, but a later run was stopped after five of the first nine adapters timed out. Reservations for interrupted requests remain accounted. Low reasoning passed the final labeled evaluation without increasing output, context, timeout or correction limits. Other earlier tested models used different schema/prompt versions and do not establish a controlled ranking.

Fifteen manually reviewed representation fixtures in `tests/fixtures/card-regressions.json` exercise the decoder and merge offline. Four source-disagreement fixtures check preservation of conflicting cited clauses. These are separate from fresh model results; see [card fixes](card-fixes.md) and [live validation](live-validation.md).

Model evaluation skips fixtures whose adapters are retired and reports their IDs under `retiredSkipped`. SafePal, Gnosis Pay and Ready are retired; historical scores above retain their original denominators.

Run the live evaluation with a securely injected key:

```sh
MAX_RUN_COST_USD=0.10 pnpm evaluate
```

The script defaults to a shared $1 cap. The core clamps every invocation to at most $4.99. It stops on a fatal model configuration or budget error and reports unrun cases separately. Reports go to ignored `.local/evaluation.json`; unit tests use simulated model responses and require no key.

Use a dedicated database, functioning DNS and accessible official sources for the complete source-to-database benchmark:

```sh
pnpm db:migrate
pnpm benchmark --all
```

Forced and unchanged passes share one budget. Unchanged snapshots must make zero model requests. Inspect successful outputs against source context and exact scopes: a valid citation and numeric checks do not prove interpretation or completeness. Do not extrapolate a successful 50-provider cost from failed or incomplete runs. See [live validation](live-validation.md) for measured outcomes and spending.

This cloud machine's native DNS resolver returns EAI_AGAIN. The approved HTTPS proxy supports source snapshots and OpenRouter calls (`NODE_USE_ENV_PROXY=1` with Node 24). Snapshot replays exercise the shared parser, extractor, PostgreSQL publication and cache reuse, but do not prove the native crawler or deployment. Explicit robots restrictions remain enforced. Production credentials belong in deployment environment bindings, never Git or reports.

## Whole-provider model comparison

The latest Luna replay attempted all 33 active adapters: 21 validated initially, and 10 more validated in a targeted pass after shared citation/feedback fixes. Bybit and Jupiter still failed. A manual audit also found omitted source disagreements in KAST, MEXC and Bitget, despite formally valid output. A passing labeled score does not supersede these failures.

A six-provider GPT-6.1 Sol comparison used the same source snapshots and contract. It produced no successful candidates: two responses were interrupted, three providers failed, and one was not run after the shared budget could not reserve another request. Its conservative application accounting was $1.718973300; this is not an actual provider invoice. It does not establish that Sol is better or that a full Sol run fits below $5. Luna remains the default pending a successful whole-provider benchmark.

Earlier compatibility probes found that Haiku 5.5 rejected the schema's optional-parameter count and Gemini 3.8 Flash rejected its first schema request. Luna Pro and Sol Crypto.com diagnostics did not complete. No automatic fallback was added. See [live validation](live-validation.md) for budget accounting and unresolved acceptance.

The evaluation matcher accepts a correctly tier-scoped rule whether its tier is the fact target or `scope.tierIds`. The required tier and price must occur on the same rule; prices for a different tier still fail. This fixes two prior matcher false negatives without changing the expected financial labels or model output.
