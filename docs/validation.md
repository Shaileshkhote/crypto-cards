# Validation status

Current verification uses **33 active adapters / 396 configured URLs**. Ready, SafePal and Gnosis Pay remain retired and were excluded from fresh source/model work; all 36 configurations remain archived. Verification attempts are **completed**; **29/33 current candidates validate**. Latest outcomes across attempted phases: 4 failed, 3 published, 5 review, 21 unchanged; 0 not yet attempted. Formal candidate validation is separate from manual completeness and source-conflict acceptance.

## Current implementation: schema 8 / prompt 41 / merge 18

One shared Luna extractor retains the existing three tools and data-only adapters. Sync extracts and caches each configured source independently, then reconciles all source claims through the existing shared resolver. Valid source caches survive failures elsewhere; publication still waits for the complete provider. Normal source failures allow other pages to be cached; budget and authorization failures halt the run. Financial source blocks are supplied before generation; already supplied full blocks are not resent by tools. Completeness checks also cover incremental source extraction. Numbered headings, telephone numbers and toll-free contact text are not prices. Truncated JSON is rejected and may use the existing two correction attempts. The shared parser keeps article content, streamed articles, outside-main page sections, and issuer/financial footer disclosures. It excludes unrelated navigation and site chrome. Confirmation uses fresh canonical evidence after product/tier alias resolution, preventing unchanged tiers from being falsely marked unconfirmed. Source precedence is applied across narrower prose conditions only when a broad authoritative rule explicitly supersedes the lower source; tier scope remains part of rule identity. Explicit /mo periods, percentages adjacent to labels, and definite fees-do-not-apply clauses and attached numeric footnotes on no-fee wording are supported without inventing currencies. Evidence checks reject country-heading citations, unsupported card types or calendar periods, and returned-payment charges inferred from late-payment text. Explicit Hindi physical/virtual card words are recognized with Unicode word matching; localized sources still require manual completeness review. No provider-specific scraper, fallback model, service, or schema relaxation was added.

The model is `openai/gpt-6-luna`, with low reasoning. Request bounds remain 300 seconds, 24,000 output tokens, 512,000 request bytes, 12 turns and two corrections. Earlier low-reasoning attempts and failed candidates remain recorded locally; their costs have not been reset. Failed or partial extractions retain accepted values. Independent card-type, scalar and non-additive inventory disagreements retain their quoted clauses and omit disputed typed values; same-block contradictions still require correction. Sensitive changes stay pending review; no reviews were automatically approved.

All **396 source URLs** were fetched using the supported crawler with proxy, TLS, robots and trusted-domain checks. This establishes retrieval, not complete model acceptance. Current validated source caches cover **391/396 configured pages**. Current code passes **191 tests**, including **20 PostgreSQL integration cases**, TypeScript, ESLint and adapter validation. The production build passes locally; exact-commit CI status is available on [draft PR #1](https://github.com/Shaileshkhote/crypto-cards/pull/1).

## Fresh adapter outcomes

| Adapter | Sources | Latest formal result | Zero-cost unchanged warm pass |
| --- | ---: | --- | --- |
| avalanche-card | 5 | review | passed |
| avici | 12 | unchanged | passed |
| bitget-wallet | 9 | review | passed |
| bitunix | 9 | unchanged | passed |
| bybit | 17 | published | passed |
| coinbase | 21 | unchanged | passed |
| crypto-com | 18 | failed | pending |
| ethena-pay | 8 | published | passed |
| etherfi | 20 | unchanged | passed |
| exa | 21 | unchanged | passed |
| hyperbeat | 12 | unchanged | passed |
| jupiter-card | 4 | review | passed |
| karta | 6 | unchanged | passed |
| kast | 15 | unchanged | passed |
| kolo | 10 | failed | pending |
| kraken | 11 | unchanged | passed |
| metamask | 11 | unchanged | passed |
| mexc | 12 | failed | pending |
| nexo-card | 7 | unchanged | passed |
| payitfast | 10 | review | passed |
| phantom-cash | 9 | unchanged | passed |
| picnic | 20 | unchanged | passed |
| plasma-one | 16 | unchanged | passed |
| redotpay | 25 | unchanged | passed |
| revolut | 10 | failed | pending |
| robinhood-gold | 13 | unchanged | passed |
| ruvo | 3 | unchanged | passed |
| solayer | 8 | unchanged | passed |
| solflare | 1 | unchanged | passed |
| tria | 15 | published | passed |
| tuyo | 13 | unchanged | passed |
| vaultleap | 11 | unchanged | passed |
| wirex-one | 14 | review | passed |

A `review` result is a candidate awaiting the normal version-checked review workflow, not approval to publish its sensitive changes. A warm pass checks zero model requests/cost and identical canonical rows, immutable versions, reviews and public cache data.

## Manual acceptance limits

Focused checks confirm Bitget's separate availability/reward country clauses and explicit card-type evidence; Payitfast's authoritative 2.2% FX candidate with conflicting pricing-page clauses retained; Jupiter's independently scoped Rain/DCS rules and compound ATM charge; Bybit's USD 350,000 monthly APAC Tier 3 source row; and KAST's competing $250/$500 ATM clauses retained in terms rather than resolved by choosing a price. These checks do not establish full manual acceptance of every tier, condition, eligibility list or reward. Independent source identities and regional claims remain visible for review. No actual sensitive-change reviews were approved.

## Remaining model failures

- **crypto-com**: https://crypto.com/document/us_card: facts[15]: Period month is absent from its cited block. Never invent a calendar period for consecutive transactions or use an annual-fee quote for a monthly fee. Preserve an unsupported limit period as a non-calculable description without amount/count. Location: fees.0 (rule monthly-fee); target crypto-com-united-states-prepaid/crypto-com-united-states-prepaid-plus; citation https://crypto.com/document/us_card#p1b56. Financial value 400 is absent from its cit
- **kolo**: https://kkinvesting.io/en/posts/kolo-card/: Uncovered financial or eligibility source blocks: [{"url":"https://kkinvesting.io/en/posts/kolo-card/","blockIds":["p1b38","p1b43","p1b97","p1b103"]}]. Source text for correction: [{"url":"https://kkinvesting.io/en/posts/kolo-card/","blockId":"p1b38","text":"After KYC, the app shows a “Choose Your Card Design” screen. In my app, I could see three design options (observed in-app; official docs don’t name them specifically). I picked the Bitcoin design.
- **mexc**: https://www.mexc.com/learn/article/mexc-card-fees-and-limits-global-card-and-mexc-card-apac-compared/1: Uncovered financial or eligibility source blocks: [{"url":"https://www.mexc.com/learn/article/mexc-card-fees-and-limits-global-card-and-mexc-card-apac-compared/1","blockIds":["p1b19","p1b20","p1b21","p1b36","p1b43","p1b44","p1b48","p1b49","p1b64","p1b65","p1b77","p1b81","p1b98","p1b99","p1b100","p1b101","p1b102","p1b103","p1b104","p1b133","p1b138","p1b139","p1b142","p1b146","p1b149","p1b150","
- **revolut**: https://assets.revolut.com/legal/terms/%5B2026.1%5D%20Revolut%20Consumer%20Prepaid%20Cardholder%20Agreement%20Effective%20April%2030%2C%202026.pdf: facts[25]: Financial value 0 is absent from its cited block. Cite the row containing that value; emit separate facts for separate table rows. Keep unrepresentable values as narrative. Location: fees.0 (rule exchange-market-hours); target revolut/revolut--united-states--kids-teens; citation https://assets.revolut.com/legal/terms/%5B2026.1%5D%20Revolut

## Spending and preservation

The additional allocation retains its **$5.834418890** prior encumbrance. This session has encumbered **$4.138116070**, for **$9.972534960 / $10**, leaving **$0.027465040** before any outstanding reservations. Outstanding reservations: **0.000000000 USD**. One local durable ledger writer reserves costs before requests across all adapters. Unknown charges remain encumbered. The original allocation remains **$24.9488113742 / $25**; no accounting was reset.

All accessible baseline values and their three original immutable versions have been retained. The final development backup restored complete matching rows across all eight tables (29 cards and 47 immutable versions in the current database). This proves retention of the available development baseline only: the previous `cards_fresh_p23_20261019` database, its 17 original accepted cards and original private accounting files have **not** been recovered.

Local PostgreSQL, migrations, health, authenticated admin pages, anonymous rejection, public cache JSON, ETag/304 and write rejection are verified. Keep the worker stopped outside controlled verification. Actual Coolify deployment, production TLS/authorization and off-host backups remain unverified. PR #1 remains draft and unmerged.

## Historical paid acceptance: schema 8 / prompt 30 / merge 14

- The previous implementation passed 147 tests, PostgreSQL integration, the production build and Compose CI.
- Fresh Luna full replay plus targeted repair produced **31/33 validated candidates**. Bybit and Jupiter failed. KAST, MEXC, Payitfast and Bitget needed source-conflict/scope resolution; formal validation did not establish complete extraction.
- Labeled evaluation passed **11/11 active cases**. The saved records contained **567 facts / 375 source extractions**, with zero citation/financial-evidence errors. These are historical counts, not fresh results for prompt 31.
- A cached pass of the **31 validated adapters** made zero model requests. One repeated EtherFi cache rebuild timed out; its isolated zero-cost recheck succeeded. Pending reviews, immutable versions and public cache payloads stayed identical.
- Accepted values from **17/17 original cards** remained. Dump/restore preserved complete rows across all eight tables. No production database was used.
- The latest full paid attempt cost **$0.189563670**, targeted repair **$0.087627770**, and the broader validation cycle **$2.996888155**. These incomplete results do not prove complete ingestion below $5.

Historical counts and acceptance above do not establish acceptance of the current profile or recovery of the previous database.

Historical counts and acceptance above do not establish acceptance of the current profile or recovery of the previous database.

Historical counts and acceptance above do not establish acceptance of the current profile or recovery of the previous database.
