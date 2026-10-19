# Extraction evaluation

The default candidate is `openai/gpt-6-luna` with high reasoning when supported. The current contract is schema 8 / prompt 23 and has not been evaluated with new paid requests. The earlier schema-7/prompt-21 expanded evaluation passed **10/11** labeled real-source cases for **$0.020326625** of accounting, including the partial attempt before the first batch reached its budget. A second batch finished the two budget-limited/unrun cases; the failed Avici case was retained. High reasoning recovered EtherFi's ETHFI reward entry compared with medium's 9/11. It still left Avici's stated issuance prices as non-calculable narrative instead of typed money. The statement-copying service passed with its USD 10 price. Complete production ingestion acceptance remains open. There is one configured model and no fallback chain.

Fifteen manually reviewed representation fixtures in `tests/fixtures/card-regressions.json` exercise the shared decoder and merge offline. They are not model-generated evaluation results; see [remaining-card fixes](card-fixes.md).

Three new labeled cases cover Phantom funding/ACH, Picnic fee allowances and VaultLeap approximate partner charges. These have not been run against a paid model. The corpus now has 14 cases, of which SafePal and the two Ready cases are retired and 11 are active; the historical 10/11 result still refers to the earlier corpus.

The checked-in model-evaluation corpus is `tests/fixtures/live-providers.json`: verified passages from Avici, Ready, Plasma One, SafePal, EtherFi, Revolut, MEXC and Bitunix. Positive and negative labels check tier-specific issuance, contractual maximums, paused issuance, KYC/custody, payment rails, non-USD FX/refunds, reward assets, aligned PDF plan columns, per-purchase limits, transaction counts, compound ATM charges distinct cancellation/chargeback services and statement-copying charges. The Avici and Revolut labels include explicit product/tier targets. Compound fees remain non-calculable narrative; known issuance and refund prices must remain typed. These short passages establish regression coverage, not full-provider precision or recall. Source text is data, never executable instructions.

Other tested routes included GPT-6 Sol/Astra, GPT-5.4 Mini, Claude Haiku, Gemini and DeepSeek. Some passed earlier corpus versions; others rejected the schema or missed labels. Those runs used different prompt/schema revisions and do not establish a controlled model ranking. Luna remains a measured low-cost candidate. No tested route has established full-provider accuracy for the final contract within this allocation; the full-provider run and manual field checks remain the acceptance test.

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
