> Historical report. Current all-active results and limitations are in [validation status](validation.md). Current code uses schema 8 / prompt 41 / merge 18 with shared per-source extraction and caching. The earlier counts, budgets and accepted database described below have not been recovered in this environment.

# Live validation — 2026-10-19 UTC

Current code uses **schema 8 / prompt 31 / merge 15**. The [six-card source fixes](source-decisions.md) have fresh HTTP/parser evidence and regression coverage. A fresh paid run of this profile has not been performed: no OpenRouter binding is available. The paid measurements below refer to the earlier prompt-30 profile and must not be reported as current-profile acceptance.

**Ingestion acceptance is incomplete.** The previous paid profile used `openai/gpt-6-luna`, low reasoning when supported, schema 8 / prompt 30 / merge 14. A fresh-source replay attempted all **33 active adapters / 396 URLs**. It produced 21 valid candidates for **$0.189563670**; a targeted pass after shared citation/feedback fixes recovered 10 of the 12 failures for **$0.087627770**. The combined result is **31/33 validated candidates**, not 33 successful publications. Bybit and Jupiter remain failed. A manual source audit also found unresolved interpretation errors in formally valid candidates.

## Verification

- **147 tests**, TypeScript, ESLint, disposable PostgreSQL integration and the production build pass on implementation commit `55980c200e4901bd1a88eff05af6259a5ee7c312`. Its CI checks and Compose job passed. Compose covers migrations, authenticated HTTP, cache jobs, restart persistence and dump/restore. Consult PR checks for subsequent documentation commits.
- Approved HTTPS proxy snapshots cover **396/396 active URLs**, including **16 PDFs**. All were reparsed after the shared list-context and table-cell spacing fixes; none was unavailable. This does not verify the native crawler.
- Fresh labeled model requests passed **11/11 active cases**, costing **$0.009983495** across **21 requests**. All 14 original fixtures remain; retirement excludes one SafePal and two Ready fixtures. These short passages do not measure whole-provider precision or recall.
- The saved prompt-30 record audit found **567 facts / 375 extraction records**, with **zero citation or financial-evidence errors**. The missing current-profile records belong to the two failed adapters. Formal evidence checks do not detect every omission or interpretation error.
- A separate **31-adapter** cached pass used **zero model requests / $0**. All 31 first cached calls validated; 30 immediate repeat calls succeeded, while EtherFi's cache rebuild hit a PostgreSQL connection timeout after its transaction committed. A subsequent isolated EtherFi cached sync succeeded with zero model calls, identical canonical data/version and cache payload, and zero cache mismatches. The initial failure remains recorded; no timeout or concurrency setting was increased. Complete pending-review rows, immutable versions and public cache payloads/hashes/versions were unchanged across these checks. Bybit and Jupiter are excluded from the 31-adapter cached set.
- Accepted values from **17/17 original stored cards**, including archived Ready, remain present. The acceptance database contains **33 active card rows / 34 total rows**; existing rows do not imply successful current-profile extraction. Public projections match committed card data.
- The saved database was dumped and restored to a new disposable database. Counts and complete-row fingerprints matched across **all eight tables**. These checks establish preservation of stored accepted values, not exhaustive extraction of source facts. No production database was used.

Ready, SafePal and Gnosis Pay are retired. Active ingestion, public reads/counts, jobs, reviews and caches exclude them, including forced sync. The archive retains **36 configurations / 433 URLs**. This acceptance database has an archived Ready row; it never had published SafePal/Gnosis rows. Canonical records and history are retained.

## Saved prompt-30 adapter outcomes

The table uses the latest completed Luna attempt for each provider. “Review” means a validated candidate with sensitive changes held for review. It does not mean approval or complete replacement of the public record. No review was automatically approved.

| Adapter | Candidate outcome | Warm model requests |
| --- | --- | ---: |
| avalanche-card | review | 0 |
| avici | review | 0 |
| bitget-wallet | review | 0 |
| bitunix | review | 0 |
| bybit | failed | 0 |
| coinbase | review | 0 |
| crypto-com | review | 0 |
| ethena-pay | review | 0 |
| etherfi | review | 0 |
| exa | review | 0 |
| hyperbeat | review | 0 |
| jupiter-card | failed | 0 |
| karta | review | 0 |
| kast | review | 0 |
| kolo | review | 0 |
| kraken | review | 0 |
| metamask | review | 0 |
| mexc | review | 0 |
| nexo-card | review | 0 |
| payitfast | review | 0 |
| phantom-cash | review | 0 |
| picnic | review | 0 |
| plasma-one | review | 0 |
| redotpay | review | 0 |
| revolut | review | 0 |
| robinhood-gold | review | 0 |
| ruvo | review | 0 |
| solayer | review | 0 |
| solflare | review | 0 |
| tria | review | 0 |
| tuyo | review | 0 |
| vaultleap | review | 0 |
| wirex-one | review | 0 |

## Remaining data-quality blockers

- **Bybit:** financial limits cite a fee row that lacks their amounts; an emitted tier scope is also invalid. The candidate is rejected and accepted values remain.
- **Jupiter:** a typed 1% FX rule and an unknown FX rule collide in the same scope. The candidate is rejected.
- **KAST:** help text gives USD 500 per withdrawal / USD 1,500 per day; the product page gives USD 250 / USD 750. Current output selects the former and omits the independently cited disagreement.
- **MEXC APAC:** one article gives a 0% transaction fee, another a 1% spending fee. Current output selects 0% without preserving both clauses as uncertainty.
- **Payitfast:** terms give 2.2% non-USD FX while pricing gives 1%. Current output separates these through component scopes without sufficient evidence that this resolves the disagreement. These cannot be treated as additive or settled charges.
- **Bitget Wallet:** differing application/country lists require correct card-versus-campaign scope. The current output does not independently preserve the disputed clauses; omission alone cannot establish exclusion.

The required behavior is to preserve independently cited conflicting clauses, omit disputed typed values when authority is unknown, and retain accepted values as unconfirmed. Prompt instructions and offline fixtures cover this behavior, but the latest model output does not consistently meet it. These candidates must not be approved as complete. See [card fixes](card-fixes.md).

## Model diagnostics

The latest six-provider GPT-6.1 Sol comparison produced **no successful candidates**. Two responses were interrupted, three providers failed and one was not run once another request could not be reserved. Conservative accounting was **$1.718973300**. It does not establish better accuracy or a successful full Sol run below $5. Luna remains the default; no fallback chain was added.

Earlier profiles exposed context exhaustion, wrong source-row selection, free-ATM allowance misclassification, bank-withdrawal classification and currency/scope identity errors. Shared fixes and their regression tests are documented separately. High/medium reasoning runs that were stopped retain their unknown reservations. No failed run, compatibility rejection or hand-corrected offline input is counted as successful full acceptance.

## Budget accounting

The original allocation's conservative upper bound remains **$24.9488113742 / $25**: model testing $9.9782594042 / $10 and adapters $14.9705519700 / $15. The subsequently authorized **additional $10** is separate: **$5.463243515 settled application accounting + $0.371175375 outstanding reservations = $5.834418890 / $10**. Interrupted calls may be settled at their full conservative reservation; these values are not provider invoices.

The latest full Luna attempt cost **$0.189563670**, but had 12 failures. Its targeted repair cost **$0.087627770**, leaving two failures. The broader validation cycle, including earlier attempts, model diagnostics and corrections, accounts for **$2.996888155**, below its $4.50 cap. None of these amounts proves that all adapters can be completely ingested below $5. At that historical point, each production invocation defaulted to $4.50 with a hard $4.99 ceiling; the current concurrent runner defaults to and caps at $5.00. No paid work is currently running; the temporary credential shell was closed.

| Additional allocation run | Accounted / upper-bound USD |
| --- | ---: |
| evaluation-p23 | 0.014832635 |
| evaluation-p24 | 0.023406320 |
| evaluation-p25-vaultleap | 0.003226510 |
| full-p25 | 0.335138015 |
| full-p26 | 0.502053120 |
| evaluation-release-p26 | 0.011491340 |
| evaluation-release-p27 | 0.016537205 |
| full-p27-release | 0.526418090 |
| repair-p27-release-v1 | 0.297387740 |
| repair-p27-release-v2 | 0.065723850 |
| repair-p27-release-full-context | 0.453609775 |
| repair-p27-release-vault-cache | 0.000000000 |
| repair-p27-release-final-two | 0.034900875 |
| evaluation-release-m13-final | 0.014293055 |
| repair-p27-release-semantic | 0.015133180 |
| repair-p27-release-p28-allowance | 0.024700090 |
| repair-p27-release-p29-allowance | 0.122894045 |
| repair-p27-release-p29-luna-pro | 0.126200975 |
| evaluation-release-p29-low | 0.009514725 |
| repair-p27-release-p29-low-target | 0.003782350 |
| repair-p27-release-p29-sol-target | 0.371109700 |
| evaluation-release-p29-haiku | 0.023160800 |
| evaluation-release-p29-gemini | 0.145049025 |
| repair-p27-release-p29-preview-target | 0.011497270 |
| repair-p27-release-p29-table-target | 0.003167005 |
| repair-p27-release-p29-full | 0.663171770 |
| evaluation-release-p29-guarded-low | 0.009871190 |
| evaluation-release-p30-final | 0.009983495 |
| repair-p27-release-p30-full | 0.189563670 |
| repair-p27-release-p30-targeted | 0.087627770 |
| model-source-quality-p30-sol | 1.718973300 |
| release-warm-current31 | 0.000000000 |

Credential values are absent from tracked files, Git history, PR text and saved environment configuration. Reports contain source/model message bodies without authorization headers. The temporary key is not bound to the reusable setup draft.

## Operational acceptance

Native public DNS on this cloud machine returns `EAI_AGAIN`. Approved HTTPS proxy snapshots exercise the shared parser, actual model, PostgreSQL sync, review and cache, but do not establish native crawling. Trusted-host/public-address checks, bounded requests and robots restrictions remain enforced. Gnosis's historical robots failures concern a retired adapter.

Actual Coolify deployment, production TLS/authorization, functioning source DNS and scheduled off-host backups remain unverified. The PR has not been merged or deployed. The reusable cloud setup draft is separate: review/save and publish it in environment settings to activate it. Saving a draft does not publish configuration or bind a credential.
