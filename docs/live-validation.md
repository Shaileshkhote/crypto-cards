# Live validation — 2026-10-18 UTC

The code is hardened, but complete production ingestion acceptance remains open. No production deployment or data was used. The supplied model credential was passed only to temporary process environments and was not saved to Git, reports, PR text or environment settings.

## Verified application behavior

The local suite passes 66 tests with PostgreSQL integration, TypeScript and lint; the production Next.js build passes. Model selection passed 8/8 short labeled real-source cases using gpt-5.4-mini, schema 2 / prompt 6, for $0.104764 of returned usage cost. These are regression passages, not a full accuracy score.

Poppler successfully parsed all ten available real PDFs, including documents that stalled PDF.js. Layout normalization now preserves aligned PDF columns. Robots 4xx responses follow RFC 9309, while explicit disallow, 429 and server failures remain blocked. Wildcard content negotiation fixes a legal host's 406 response. The proxy audit recovered thirteen previously inaccessible sources; verified source maintenance adds four current official pages. Of the maintained 436 URLs, 419 have successful HTTP snapshots and 418 are readable without browser rendering. See [source maintenance](source-maintenance.md).

## Full-inventory replay

This is a replay of actual HTTPS proxy snapshots through the shared parser, model, PostgreSQL publication and cache functions. Native crawler public-address validation remains blocked by cloud DNS failures. The run used gpt-5.4-mini, schema 2 / prompt 6, and a shared $0.90 remaining diagnostic cap. It made 78 requests with $0.743633 in application accounting.

- Two providers published: EtherFi and Revolut. Both unchanged passes reused all source extractions with zero model requests.
- Four providers were rejected for conflicting rule identities: Avici, MEXC, Nexo and Avalanche. Published data was preserved.
- Three providers had source access failures: Gnosis Pay (explicit robots disallow), Wirex (unavailable country URL), and Tria (JavaScript content plus an untrusted redirect).
- Twenty-seven providers reached the shared budget boundary, including some partially read providers. They are not evidence of extraction accuracy or extraction failure with sufficient budget.

| Provider | Replay outcome | Model requests |
| --- | --- | ---: |
| etherfi | Published; unchanged reuse: 0 requests | 5 |
| avici | Conflicting rule identity; preserved data | 8 |
| gnosis-pay | Source inaccessible | 0 |
| mexc | Conflicting rule identity; preserved data | 8 |
| revolut | Published; unchanged reuse: 0 requests | 5 |
| nexo-card | Conflicting rule identity; preserved data | 11 |
| bitget-wallet | Budget limited; not fully evaluated | 6 |
| avalanche-card | Conflicting rule identity; preserved data | 7 |
| bybit | Budget limited; not fully evaluated | 4 |
| coinbase | Budget limited; not fully evaluated | 1 |
| crypto-com | Budget limited; not fully evaluated | 2 |
| ethena-pay | Budget limited; not fully evaluated | 2 |
| bitunix | Budget limited; not fully evaluated | 5 |
| exa | Budget limited; not fully evaluated | 1 |
| jupiter-card | Budget limited; not fully evaluated | 2 |
| hyperbeat | Budget limited; not fully evaluated | 2 |
| kast | Budget limited; not fully evaluated | 1 |
| kolo | Budget limited; not fully evaluated | 2 |
| kraken | Budget limited; not fully evaluated | 0 |
| metamask | Budget limited; not fully evaluated | 0 |
| payitfast | Budget limited; not fully evaluated | 0 |
| phantom-cash | Budget limited; not fully evaluated | 0 |
| picnic | Budget limited; not fully evaluated | 0 |
| plasma-one | Budget limited; not fully evaluated | 0 |
| ready | Budget limited; not fully evaluated | 0 |
| redotpay | Budget limited; not fully evaluated | 0 |
| robinhood-gold | Budget limited; not fully evaluated | 0 |
| ruvo | Budget limited; not fully evaluated | 0 |
| safepal | Budget limited; not fully evaluated | 0 |
| solayer | Budget limited; not fully evaluated | 0 |
| solflare | Budget limited; not fully evaluated | 0 |
| tria | Source inaccessible | 0 |
| tuyo | Budget limited; not fully evaluated | 0 |
| vaultleap | Budget limited; not fully evaluated | 0 |
| wirex-one | Source inaccessible | 0 |
| karta | Budget limited; not fully evaluated | 6 |

## Root fixes after replay

The rejected outputs showed why the collisions occurred: ATM withdrawal/decline/balance inquiry and late/returned/cross-border payments were forced into generic fee kinds; MEXC's per-transaction and transaction-count limits were forced into daily money limits; Nexo's weekday/weekend rates lacked a temporal scope. Schema 3 / prompt 7 now represents these distinctions, with regression tests for separate stable identities and applicability. Unsupported limits can retain narrative without becoming invented money.

A final Avici retest read sources successfully but hit the 12,000-token output bound ($0.126847 of conservative accounting). The final configuration provides a bounded 24,000-token output allowance and reserves its maximum cost before each call. That revision needs a fresh live acceptance run; it has not been declared successful from unit tests alone. Earlier rejected-model and schema diagnostics were stopped after revealing their root errors. The combined diagnostic allowance remained below $5 with conservative reservations for uncertain responses; returned usage and application reservations are not a provider invoice.

## Deployment and acceptance boundary

CI builds and runs the complete three-service Compose application, including health/migrations, cache jobs, authenticated HTTP, persistence across restart and dump/restore. Refer to the PR checks for the exact tested commit. This closes the earlier inability to fit the full stack on this cloud machine's 32 GB Docker VFS filesystem.

Production acceptance still requires a native cold/warm run with functioning DNS, accessible approved sources, full-provider field/scope checks for schema 3 / prompt 7 and the final output limit, and the actual Coolify deployment. No 50-provider cost estimate is justified by these results. Off-host backups, production authorization and HTTPS routing remain deployment-specific checks.
