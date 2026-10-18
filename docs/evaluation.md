# Extraction evaluation

The default model is `openai/gpt-5.4-mini`, selected after comparing live extractions with six synthetic scenarios and eight labeled real-source cases. The real-source selection run passed **8/8** cases, including the shared publication validator, with $0.104764 of returned usage cost. Earlier `gpt-4.1-mini` and `gpt-5-mini` runs missed supported facts or inferred unsupported values. There is one configured model, with no fallback chain.

The checked-in corpus is `tests/fixtures/live-providers.json`: short verified passages from Avici, Ready, Plasma One, SafePal, EtherFi and Revolut. It checks issuance scope, contractual maximums, paused issuance, KYC/custody, payment rails, non-USD FX/refunds, reward assets and aligned PDF plan columns. Positive and negative labels are checked against typed facts. These passages establish regression coverage, not full-provider precision or recall. They are source data, never executable instructions.

Run the inexpensive live evaluation with a securely injected key:

```sh
pnpm evaluate
```

Its default shared cap is $0.40; `MAX_RUN_COST_USD` can lower or override it, up to the core $5 maximum. Reports containing extracted public passages go to ignored `.local/evaluation.json`. Unit tests use simulated model responses and require no key.

For a complete source-to-database check, use a dedicated benchmark database, functioning DNS and access to the provider's public documentation:

```sh
pnpm db:migrate
pnpm benchmark etherfi avici mexc gnosis-pay nexo-card revolut
```

Forced and unchanged passes share one budget. Unchanged snapshots must make zero model requests. Inspect successful outputs against source context and exact scopes; a valid quote proves the passage exists, not that the interpretation is right. Do not extrapolate 50-provider cost from failed or incomplete runs. The latest full-inventory replay and access restrictions are recorded in [live validation](live-validation.md).

This cloud machine's native DNS resolver returns EAI_AGAIN. Proxy-fetched source snapshots test parsing, model extraction, publication and cache reuse, but cannot prove the native crawler or production deployment. Explicit robots restrictions remain enforced. Production credentials belong in deployment environment bindings, never Git or reports.
