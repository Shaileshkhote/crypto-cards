# Validation status

**Fresh model acceptance is still pending for the six-card repair.** Ready, SafePal and Gnosis Pay are retired; **33 active adapters / 396 URLs** remain, with all configurations and historical data preserved.

## Current implementation: schema 8 / prompt 31 / merge 15

All **67 configured sources** for Bybit, Jupiter, KAST, MEXC, Payitfast and Bitget Wallet were freshly fetched through the approved HTTPS proxy and parsed, including four PDFs. Comparing all 63 HTML documents with the previous parser found no missing word/numeric tokens; five documents changed because merged cells now retain their headers and region labels. These checks establish source retrieval and parsing, not a successful native crawler or model extraction.

Shared changes address currency-code limit retrieval, merged financial tables, ATM-versus-purchase scope correction, source-disagreement preservation and explicit contractual precedence. Payitfast's card terms override its pricing page for matching charges. KAST, MEXC and Bitget retain independently cited competing claims where the sources do not establish authority. Disputed typed values are omitted; accepted values and their original provenance remain unconfirmed and sensitive changes require review. Acknowledging the same retained facts does not create another review after publishing the accompanying source notes. See [source decisions](source-decisions.md) for official links and the evidence behind each decision.

The current suite contains **160 tests**, including 17 PostgreSQL integration cases. TypeScript and ESLint pass. A focused run passed all **51 extractor, parser and source-conflict tests**. Local full database attempts hit the existing 15-second test limit and subsequent lock contention; those failures remain recorded rather than counted as passes. The new source-disagreement acknowledgment integration case passed in that run. Test/request timeouts and extraction limits have not been increased. Check [PR #1](https://github.com/Shaileshkhote/crypto-cards/pull/1) for CI verification of the exact implementation commit and its production/Compose builds.

No paid calls have been made for this profile. The runtime key and saved `OPENROUTER_API_KEY` binding are absent; the previous temporary session is closed. Fresh paid extraction needs that existing key supplied securely through environment settings, never committed or pasted into configuration text.

## Historical paid acceptance: schema 8 / prompt 30 / merge 14

- The previous implementation passed 147 tests, PostgreSQL integration, the production build and Compose CI.
- Fresh Luna full replay plus targeted repair produced **31/33 validated candidates**. Bybit and Jupiter failed. KAST, MEXC, Payitfast and Bitget needed source-conflict/scope resolution; formal validation did not establish complete extraction.
- Labeled evaluation passed **11/11 active cases**. The saved records contained **567 facts / 375 source extractions**, with zero citation/financial-evidence errors. These are historical counts, not fresh results for prompt 31.
- A cached pass of the **31 validated adapters** made zero model requests. One repeated EtherFi cache rebuild timed out; its isolated zero-cost recheck succeeded. Pending reviews, immutable versions and public cache payloads stayed identical.
- Accepted values from **17/17 original cards** remained. Dump/restore preserved complete rows across all eight tables. No production database was used.
- The latest full paid attempt cost **$0.189563670**, targeted repair **$0.087627770**, and the broader validation cycle **$2.996888155**. These incomplete results do not prove complete ingestion below $5.

The additional allocation's conservative upper bound remains **$5.834418890/$10**, leaving **$4.165581110**; the earlier allocation remains **$24.9488113742/$25**. No paid model work is running. Do not reset these ledgers or reclaim unknown reservations.

Native crawling remains unverified because cloud DNS fails; actual Coolify deployment, production authorization/TLS and off-host backups remain unverified. [Draft PR #1](https://github.com/Shaileshkhote/crypto-cards/pull/1) has not been merged or deployed. See [live validation](live-validation.md), [card fixes](card-fixes.md) and [evaluation](evaluation.md).

The reusable cloud setup draft records startup instructions and the repository revision. Review/save and publish it in environment settings to activate it. Credential values are absent from Git, PR text and saved configuration.
