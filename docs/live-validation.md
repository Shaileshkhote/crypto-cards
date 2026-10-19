# Live validation — 2026-10-19 UTC

Complete production ingestion acceptance remains open. Code checks, source access, model regression cases and publication outcomes are separate measurements. No production deployment or production data was used.

## Application and sources

TypeScript, ESLint and **124 tests** pass with PostgreSQL integration. The Next.js production build passes. CI additionally builds/runs the three-service Compose application: migrations, authenticated HTTP, cache jobs, restart persistence and dump/restore. Inspect the PR checks for the exact tested commit. The final local HTTP smoke covered all four admin screens, anonymous rejection, public POST denial, cache ETag/304, and visible fixed-fee conditions, minimums, maximums and allowances using a labeled synthetic fixture.

The maintained inventory is **36 providers / 433 configured URLs**. The fresh approved HTTPS proxy audit fetched 418 successfully; 15 Gnosis Pay help articles explicitly disallow this crawler. All ten available text PDFs parsed through bounded Poppler extraction. Native public DNS still returns EAI_AGAIN, including outside the process sandbox. See [source maintenance](source-maintenance.md).

The subsequent [remaining-card fixes](card-fixes.md) used offline data only: Revolut validates from unchanged recorded output, and six manually reviewed candidates publish in a copied database. That dataset has 17 cards with 17 unchanged warm passes and all original accepted values retained. These results do not replace the historical paid replay below.

SafePal, Gnosis Pay and Ready have since been retired through adapter configuration. The active inventory is now **33 adapters / 396 URLs**; archived configurations and historical measurements remain available. Retirement tests verify zero model/source work, exclusion from active database/cache counts, and retention of canonical data and history. See [adapter retirement](adapters.md#retiring-an-adapter).

## Final inventory replay

This was a sequential diagnostic replay through the shared parser, extractor, PostgreSQL publication and cache functions, using actual HTTPS proxy source snapshots. Its model settings were `openai/gpt-6-luna`, **medium reasoning, schema 6 / prompt 20**, and a shared **$0.445 remaining test cap**. It attempted the inventory of 36 providers and made **144 paid-model requests** with **$0.425622495 application accounting**.

Outcomes: **{'published': 10, 'extraction_failed': 12, 'source_blocked': 1, 'budget_limited': 13}**. All ten warm attempts made zero model calls; **9/10** succeeded unchanged. Bybit's warm attempt failed because auto-created IDs were normalized at publication but resolved by an ambiguous repeated tier name on reuse. The final merge resolves the same normalized ID and explicit aliases before names. Recomputing Bybit from its actual 17 stored source extractions and snapshots now produces a byte-identical publication with zero held changes, safe changes or model calls. This is an offline verification of the identity fix, not a rerun of the final model profile.

Budget-limited providers are not completed accuracy tests. The diagnostic harness continued individual provider calls when a smaller request could fit the remaining shared budget; the production worker stops remaining adapters after its first fatal budget error. This replay does not establish a successful native `sync --all`, complete extraction under $5, or full-provider accuracy.

The source audit covers all configured URLs independently of the model cutoff. Publication means schema, citation and publication validation passed; it does not prove every interpretation or omitted fact. Failed candidates preserve accepted data. No values or tests were weakened to turn rejected candidates into successful publications.

| Provider | Outcome | Cold model calls | Warm model calls | Issue |
| --- | --- | ---: | ---: | --- |
| avalanche-card | published | 4 | 0 |  |
| avici | extraction_failed | 8 | — | Conflicting extracted facts: avici/avici/effectiveFrom; published values retained |
| bitget-wallet | extraction_failed | 6 | — | Conflicting extracted lists: bitget-wallet/bitget-wallet/residentCountries; published values retained |
| bitunix | published | 9 | 0 |  |
| bybit | published | 5 | 0 | Warm identity failure; fixed and verified against 17 cached extractions, as described above |
| coinbase | extraction_failed | 4 | — | Agent context limit exceeded |
| crypto-com | published | 4 | 0 |  |
| ethena-pay | extraction_failed | 5 | — | Ambiguous rewards identity; conflicting rules share a scope |
| etherfi | published | 6 | 0 |  |
| exa | extraction_failed | 6 | — | [{"validation":"regex","code":"invalid_string","message":"Invalid","path":["facts",17,"value",0,"fixed","amount"]}] |
| gnosis-pay | source_blocked | 0 | — | 15 help pages disallowed by robots.txt |
| hyperbeat | published | 4 | 0 |  |
| jupiter-card | extraction_failed | 6 | — | Conflicting extracted facts: jupiter-card/jupiter-card/issuer; published values retained |
| karta | extraction_failed | 3 | — | Ambiguous fees identity; conflicting rules share a scope |
| kast | extraction_failed | 6 | — | Conflicting extracted facts: kast/kast/fees; published values retained |
| kolo | extraction_failed | 7 | — | Ambiguous fees identity; conflicting rules share a scope |
| kraken | extraction_failed | 6 | — | Ambiguous rewards identity; conflicting rules share a scope |
| metamask | published | 3 | 0 |  |
| mexc | extraction_failed | 7 | — | Financial value 0 is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative. |
| nexo-card | published | 6 | 0 |  |
| payitfast | budget_limited | 3 | — | Budget exhausted: no new OpenRouter request sent |
| phantom-cash | budget_limited | 5 | — | Budget exhausted: no new OpenRouter request sent |
| picnic | budget_limited | 3 | — | Budget exhausted: no new OpenRouter request sent |
| plasma-one | budget_limited | 3 | — | Budget exhausted: no new OpenRouter request sent |
| ready | published | 4 | 0 |  |
| redotpay | budget_limited | 4 | — | Budget exhausted: no new OpenRouter request sent |
| revolut | extraction_failed | 3 | — | Financial value 0 is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative. |
| robinhood-gold | budget_limited | 1 | — | Budget exhausted: no new OpenRouter request sent |
| ruvo | budget_limited | 3 | — | Budget exhausted: no new OpenRouter request sent |
| safepal | budget_limited | 2 | — | Budget exhausted: no new OpenRouter request sent |
| solayer | budget_limited | 2 | — | Budget exhausted: no new OpenRouter request sent |
| solflare | published | 2 | 0 |  |
| tria | budget_limited | 1 | — | Budget exhausted: no new OpenRouter request sent |
| tuyo | budget_limited | 1 | — | Budget exhausted: no new OpenRouter request sent |
| vaultleap | budget_limited | 1 | — | Budget exhausted: no new OpenRouter request sent |
| wirex-one | budget_limited | 1 | — | Budget exhausted: no new OpenRouter request sent |

## Final contract and selected reasoning

The full replay exposed a statement-copying charge labeled as a normal transaction fee. The final code uses **schema 7 / prompt 21**, supports a named uncommon service with its typed price, and excludes unrelated uncommon services from generic numeric fee sorting. Fixed and percentage displays retain price conditions, minimums, maximums and allowances. This change was checked against the actual source clause and the running UI; it was not represented as a fresh full-provider replay.

The selected high-reasoning Luna profile passed **10/11** labeled passages for **$0.020326625** of accounting across two batches, including the partial attempt before the first batch's cap. The second batch finished two budget-limited/unrun cases; the failed Avici case was retained. High reasoning recovered the ETHFI reward missed by medium. Avici's stated $15/$10/$50 issuance prices still appeared as non-calculable narrative rather than typed money. The named statement-copying charge passed with its USD 10 price. See [evaluation](evaluation.md).

A planned whole-provider check of the final service contract was not started: the remaining adapter allowance could not fund a conservative request reservation. **Neither the complete high-reasoning/schema-7 inventory nor the current schema-8/prompt-23 inventory has been benchmarked.**

## Stored-data audit and restore

The replay stored **354 facts / 108 source extractions**, with zero invalid source citations or financial numeric/currency evidence found by the audit. All published cards parse under the final schema. These are formal validation checks, not semantic accuracy guarantees.

Positive labels were also checked against the published full-provider cards where available. Of 4 applicable published cases, 2 expected claims were missing or misclassified: EtherFi's ETHFI reward and the earlier statement-copy classification. Unpublished/budget-limited providers could not pass this check. The final contract addresses the latter classification in its labeled test; the full replay data remains a disposable diagnostic dataset.

The actual replay database was dumped and restored into a separate disposable database. Counts and complete-row fingerprints match across all eight tables: 10 cards, 433 sources, 108 extractions, 10 immutable versions, 0 reviews, 0 jobs, 11 cache entries and 1 migration record. Integration tests separately cover rejected/incomplete extraction, missing/removed sources, sensitive-change holds, immutable/superseded proposals and stale approvals. This establishes preservation of stored data; it does not establish that every source fact was extracted.

## Budget accounting

Model selection/compatibility diagnostics have a conservative accounting upper bound of **$9.978259 / $10**. Adapter runs have **$14.970552 / $15**; combined accounting is **$24.948811 / $25**. Returned costs are settled where available. Unknown outcomes retain reservations; rejected-schema bounds exclude pricing tiers their input bounds could not reach. This is application accounting, not a provider invoice.

Two superseded sequential runs were stopped. Each retains its reported spend, its last known response again to cover interrupted settlement, and a maximum in-flight reservation of $0.147024: `(512000 + 4096) × $0.00000025 + 24000 × $0.00000075`. Their bounds were retained before funding the final replay.

| Adapter diagnostic | Accounted / upper-bound USD |
| --- | ---: |
| replay-luna | 0.205042 |
| replay-sol-full | 4.282964 |
| replay-luna-final | 0.273024 |
| replay-sol-v5-final | 4.330379 |
| replay-final-sequential | 4.397173 |
| replay-release | 0.259574 |
| replay-medium-release (stopped; upper bound) | 0.510758 |
| replay-final-current (stopped; upper bound) | 0.286015 |
| replay-s6-p20-final | 0.425622 |

The production default is a shared $4.50 budget with a hard $4.99 ceiling, even if a larger override is provided. Source failures and budget boundaries remain visible; unsuccessful runs are not evidence that all providers can be completely ingested below $5. The supplied key was not committed, published in the PR or stored in saved environment settings.

## Remaining acceptance

Gnosis needs accessible official sources or provider permission. Payitfast's official pricing and card terms contain conflicting non-USD charges. Other table failures need correct source interpretation, scopes or complete extraction; they were not resolved by arbitrarily choosing rates or merging contradictory eligibility lists.

Acceptance still requires complete financial/eligibility field checks, the final profile's native cold/warm run with functioning DNS and accessible sources, and actual Coolify deployment with HTTPS, production authorization and scheduled off-host backups. The cloud setup draft is saved separately; saving a draft does not publish configuration or bind the test key.
