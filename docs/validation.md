# Validation status

Current verification uses **33 active adapters / 396 configured URLs**. Ready, SafePal and Gnosis Pay remain retired and were excluded from fresh source/model work; all 36 configurations remain archived. Verification attempts are **completed**; **33/33 current candidates validate**. Latest outcomes across attempted phases: 5 review, 28 unchanged; 0 not yet attempted. Formal candidate validation is separate from manual completeness and source-conflict acceptance.

## Current implementation: schema 8 / prompt 41 / merge 18

Fresh paid verification resumed after the user raised the total allocation ceiling from $10 to $12. All earlier spending and unknown charges remain accounted.

One shared Luna extractor retains the existing three tools and data-only adapters. Sync extracts and caches each configured source independently, then reconciles all source claims through the existing shared resolver. Valid source caches survive failures elsewhere; publication still waits for the complete provider. Normal source failures allow other pages to be cached; budget and authorization failures halt the run. Financial source blocks are supplied before generation; already supplied full blocks are not resent by tools. Completeness checks also cover incremental source extraction. Numbered headings, telephone numbers and toll-free contact text are not prices. Truncated JSON is rejected and may use the remaining turns within the existing twelve-turn limit. The shared parser keeps article content, streamed articles, outside-main page sections, and issuer/financial footer disclosures. It excludes unrelated navigation and site chrome. Confirmation uses fresh canonical evidence after product/tier alias resolution, preventing unchanged tiers from being falsely marked unconfirmed. Source precedence is applied across narrower prose conditions only when a broad authoritative rule explicitly supersedes the lower source; tier scope remains part of rule identity. Explicit /mo periods, percentages adjacent to labels, and definite fees-do-not-apply clauses and attached numeric footnotes on no-fee wording are supported without inventing currencies. Evidence checks reject country-heading citations, unsupported card types or calendar periods, and returned-payment charges inferred from late-payment text. Explicit Hindi physical/virtual card words are recognized with Unicode word matching; localized sources still require manual completeness review. No provider-specific scraper, fallback model, service, or schema relaxation was added.

The four previously blocked adapters—Crypto.com, Kolo, MEXC and Revolut—now validate. Revolut continued its previously paid draft with one fresh paid correction; the replayed draft was charged zero additional cost, while all original charges remain recorded.

Correction feedback includes the full required citation checklist so replacement drafts retain previously covered blocks. URL fields are constrained to the current source URLs, including newly discovered pages. The application always copies the selected source block into evidence; it never trusts a generated quote. Invalid financial rules can receive bounded possible-source hints, but every corrected fact still needs independent evidence and candidate validation. Exact URL replacement feedback preserves percent-encoding without accepting invented URLs. Count limits must distinguish the source-named service rather than changing or discarding a supported count.

The model is `openai/gpt-6-luna`, with low reasoning. Request bounds remain 300 seconds, 24,000 output tokens, 512,000 request bytes, 12 total turns shared by reading and correction. Earlier low-reasoning attempts and failed candidates remain recorded locally; their costs have not been reset. Failed or partial extractions retain accepted values. Independent card-type, scalar and non-additive inventory disagreements retain their quoted clauses and omit disputed typed values; same-block contradictions still require correction. Sensitive changes stay pending review; no reviews were automatically approved.

All **396 source URLs** were fetched using the supported crawler with proxy, TLS, robots and trusted-domain checks. This establishes retrieval, not complete model acceptance. Current validated source caches cover **396/396 configured pages**. Current code passes **207 tests**, including **23 PostgreSQL integration cases**, TypeScript, ESLint and adapter validation. The production build passes locally; exact-commit CI status is available on [draft PR #1](https://github.com/Shaileshkhote/crypto-cards/pull/1).

## Concurrent job execution

Full jobs now start one task per selected active adapter (currently 33), sharing one $5.00 default and maximum request budget. Per-adapter accounts retain correct source and card cost attribution while reservations and aggregate totals remain shared. Progress writes are serialized, fatal errors block further reservations, and job finalization waits for in-flight work. Dedicated session-lock connections keep long-running card locks outside the query pool.

The concurrency change passes 207 tests, including 23 isolated PostgreSQL integration cases, TypeScript and ESLint. Tests exercise all active adapters overlapping, aggregate/per-card costs, fatal-error draining, reservation contention and query access while all 33 card locks are held. Paid concurrent extraction has not been run; earlier model and warm-cache outcomes below remain prior acceptance evidence.

Before this concurrency change, the local Mac's shared-$0.75 sequential refresh published 10 cards, failed 8, and left 15 not run after the next request could not be reserved. It conservatively accounted for $0.727396265 and retained 130 validated source caches. Network/robots failures affected Bitunix, Bybit, Coinbase, EtherFi and KAST; Exa failed source coverage, Kraken timed out, and MEXC stopped on budget. The local database is distinct from the earlier 33-card acceptance below. Combined conservative accounting, including upstream $10.246623815, prior local $0.037838600 and this refresh, is $11.011858680; the earlier local $0.024099250 outstanding reservation remains included. Neither the historical database nor original private ledgers have been recovered. The concurrency code checks incurred no paid model cost.

## Fresh adapter outcomes

| Adapter | Sources | Latest formal result | Zero-cost unchanged warm pass |
| --- | ---: | --- | --- |
| avalanche-card | 5 | review | passed |
| avici | 12 | unchanged | passed |
| bitget-wallet | 9 | review | passed |
| bitunix | 9 | unchanged | passed |
| bybit | 17 | unchanged | passed |
| coinbase | 21 | unchanged | passed |
| crypto-com | 18 | unchanged | passed |
| ethena-pay | 8 | unchanged | passed |
| etherfi | 20 | unchanged | passed |
| exa | 21 | unchanged | passed |
| hyperbeat | 12 | unchanged | passed |
| jupiter-card | 4 | review | passed |
| karta | 6 | unchanged | passed |
| kast | 15 | unchanged | passed |
| kolo | 10 | unchanged | passed |
| kraken | 11 | unchanged | passed |
| metamask | 11 | unchanged | passed |
| mexc | 12 | unchanged | passed |
| nexo-card | 7 | unchanged | passed |
| payitfast | 10 | review | passed |
| phantom-cash | 9 | unchanged | passed |
| picnic | 20 | unchanged | passed |
| plasma-one | 16 | unchanged | passed |
| redotpay | 25 | unchanged | passed |
| revolut | 10 | unchanged | passed |
| robinhood-gold | 13 | unchanged | passed |
| ruvo | 3 | unchanged | passed |
| solayer | 8 | unchanged | passed |
| solflare | 1 | unchanged | passed |
| tria | 15 | unchanged | passed |
| tuyo | 13 | unchanged | passed |
| vaultleap | 11 | unchanged | passed |
| wirex-one | 14 | review | passed |

A `review` result is a candidate awaiting the normal version-checked review workflow, not approval to publish its sensitive changes. A warm pass checks zero model requests/cost and identical canonical rows, immutable versions, reviews and public cache data.

## Manual acceptance limits

Focused checks confirm Revolut’s independently scoped 15 daily card transactions and 3 daily ATM withdrawals; MEXC’s separate Global/APAC charges and dated promotion clauses; Crypto.com’s independently scoped prepaid/credit plan fees; and Bitget’s separate availability/reward country clauses and explicit card-type evidence. Additional checks confirm Payitfast's authoritative 2.2% FX candidate with conflicting pricing-page clauses retained; Jupiter's independently scoped Rain/DCS rules and compound ATM charge; Bybit's USD 350,000 monthly APAC Tier 3 source row; and KAST's competing $250/$500 ATM clauses retained in terms rather than resolved by choosing a price. These checks do not establish full manual acceptance of every tier, condition, eligibility list or reward. Independent source identities and regional claims remain visible for review. No actual sensitive-change reviews were approved.

## Remaining model failures

None in the final formal pass.

## Spending and preservation

The additional allocation retains its **$5.834418890** prior encumbrance. This session has encumbered **$4.412204925**, for **$10.246623815 / $12**, leaving **$1.753376185** before any outstanding reservations. Outstanding reservations: **0.000000000 USD**. One local durable ledger writer reserves costs before requests across all adapters. Unknown charges remain encumbered. The original allocation remains **$24.9488113742 / $25**; no accounting was reset.

All accessible baseline values and their three original immutable versions have been retained. The new development backup restored complete matching rows across all eight tables (33 cards and 51 immutable versions). The prior verified backup remains intact; the new dump is `.local/twelve-current-data.dump` and its complete-row comparison is `.local/twelve-backup-restore-report.json`. This proves retention of the available development baseline only: the previous `cards_fresh_p23_20261019` database, its 17 original accepted cards and original private accounting files have **not** been recovered.

Local PostgreSQL, migrations, health, authenticated admin pages, anonymous rejection, public cache JSON, ETag/304 and write rejection are verified. The public cache contains 235 unique product/tier rows across all 33 active providers and excludes the three retired providers. Keep the worker stopped outside controlled verification. Actual Coolify deployment, production TLS/authorization and off-host backups remain unverified. PR #1 remains draft and unmerged.

## Historical paid acceptance: schema 8 / prompt 30 / merge 14

- The previous implementation passed 147 tests, PostgreSQL integration, the production build and Compose CI.
- Fresh Luna full replay plus targeted repair produced **31/33 validated candidates**. Bybit and Jupiter failed. KAST, MEXC, Payitfast and Bitget needed source-conflict/scope resolution; formal validation did not establish complete extraction.
- Labeled evaluation passed **11/11 active cases**. The saved records contained **567 facts / 375 source extractions**, with zero citation/financial-evidence errors. These are historical counts, not fresh results for prompt 31.
- A cached pass of the **31 validated adapters** made zero model requests. One repeated EtherFi cache rebuild timed out; its isolated zero-cost recheck succeeded. Pending reviews, immutable versions and public cache payloads stayed identical.
- Accepted values from **17/17 original cards** remained. Dump/restore preserved complete rows across all eight tables. No production database was used.
- The latest full paid attempt cost **$0.189563670**, targeted repair **$0.087627770**, and the broader validation cycle **$2.996888155**. These incomplete results do not prove complete ingestion below $5.

Historical counts and acceptance above do not establish acceptance of the current profile or recovery of the previous database.
