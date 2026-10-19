# Card fixes — 19 October 2026 UTC

Ready, SafePal and Gnosis Pay are retired through `config.retired`. The active inventory is **33 adapters / 396 URLs**; the archive retains all 36 configurations and 433 URLs. Retirement excludes providers from ingestion and public data while preserving accepted records and history. Force does not bypass retirement.

## Six-card follow-up

Schema 8 / prompt 31 / merge 15 adds currency-code financial retrieval, balanced source previews, table-span context, source-supported ATM clauses in correction feedback, independent claim reconciliation and explicit contractual precedence. Source research fetched all 67 configured URLs for these cards; see [source decisions](source-decisions.md). The earlier failures below describe saved prompt-30 model output. They have not yet been replaced by a fresh paid prompt-31 run.

## Shared fixes

- Missing source facts preserve accepted values and mark them unconfirmed. Review proposals now derive uncertainty from current state, so unchanged runs retain the same immutable review. Acknowledging an uncertainty-only review does not recreate it on every run or turn an unconfirmed value into confirmed data.
- Tool continuations retain provider reasoning state. Corrections retain the newest complete JSON draft and all source/tool text, replacing superseded invalid drafts and feedback while omitting opaque completed-draft reasoning. A real Coinbase draft contained over 110 KB of opaque state; resending it exhausted context before correction. Context/output limits remain unchanged.
- Financial correction feedback uses the same short page/block selectors the model saw, identifies the incorrect rule and shows the current cited block when its reference resolves. Invalid references use only the URL and short selector; the application copies the exact quote. It reports construction conflicts alongside citation errors in the same correction, rather than revealing them only after numeric errors are fixed. Stored evidence retains content hashes. This lets a correction find Bybit's actual fee row rather than guessing from a storage-only hash.
- Explicit zero-fee wording accepts definite “does not have any fees” clauses, waived price cells, comma/conjunction lists and definite “will not charge fees” clauses. Definite contractions and passive wording such as “will not be charged a fee” also support zero; possible/refused waivers still fail; typed money still requires source currency evidence.
- Approximate partner fees remain unknown fee rules, exact provider markups remain separately scoped, and FX conversions use the FX kind. Monetary free allowances retain their typed amount and period alongside withdrawal-count conditions. When the free allowance and the above-allowance fee occur in different blocks, separately cited zero-fee and above-allowance rules preserve both without joining evidence or copying prices between blocks.
- Initial source previews and financial search prioritize blocks with explicit money or percentages, keeping original offsets. A KAST spot-check found that two early ATM marketing matches had hidden the later USD 250 limit; this is a shared retrieval fix, not a provider override.
- Unambiguous short decimal-comma percentages such as `1,5%` validate as 1.5%. Three-digit grouping and ambiguous money notation such as `10.000$` retain their prior treatment.
- Monetary currencies participate in rule identity, including minimums, caps and allowances. EUR/GBP alternatives no longer collide; different prices in the same currency still conflict, and a changed price keeps its identity for review. Merge version 14 preserves existing accepted records while holding changed rule identities for review.
- Table-cell line breaks and paragraph boundaries remain spaces before rows are normalized, preserving labels such as “Free ATM withdrawals.” A paragraph directly introducing an HTML list stays with its bounded row groups. Free monthly ATM allowances retain the actual “free” context in each cited block; following paid-fee paragraphs remain separate. This fixes Nexo without weakening numeric or citation evidence.
- Fee-free ATM table/list amounts cannot become hard withdrawal limits, and an unlimited/“None” limit does not become zero. Bank-account withdrawals over ACH/wire/SEPA are named services rather than ATM cash withdrawals. Cached records are checked against current schema and evidence rules; only invalid records are re-extracted, while accepted values remain protected.
- A complete full-inventory response containing no source facts is corrected or rejected, preventing empty records from being accepted as a finished provider run. Empty incremental results remain valid when other configured sources are outside the invocation.
- A calculability change replaces incompatible union fields instead of retaining an old amount/count on an unknown limit. The change still requires review; VaultLeap recovered from its cached extraction without a model call.
- Crypto.com’s regional programs are products and its named plans are tiers. The data-only adapter hints cover nine programs and 45 plan variants, remove an ambiguous prepaid-to-GCC alias, and contain no static prices.
- Existing conditions distinguish debit/credit funding, standard/fast ACH, spending bands, first/additional cards and conversion types. Reward kinds distinguish cashback, salary matching, yield and referral. Cash advances remain separate from ATM withdrawals.

No provider-specific extractor, fallback model, additional agent or queue was added. No evidence check, request timeout, context bound or review requirement was relaxed.

## Source disagreements

The model must preserve independently cited conflicting clauses and omit disputed typed values when the sources do not establish an authority. Accepted values remain protected by review. This is the required extraction behavior; the latest manual audit still found KAST, MEXC and Bitget choosing or omitting parts of these disagreements. These candidates must not be treated as complete or approved without resolving the disputed scopes.

| Card | Source disagreement |
| --- | --- |
| KAST | Help article: USD 500 per withdrawal; product page: USD 250. |
| MEXC APAC | Comparison table: 0% transaction fee; application article: 1% spending fee. |
| Payitfast | Pricing: 1% non-USD FX; card terms: 2.2%. |
| Bitget Wallet | Main card page includes Singapore/mainland China; reward application list omits them. Omission alone does not resolve card eligibility. |

## Verification

Fresh prompt-30 requests passed **11/11 active labeled cases** for **$0.009983495**. The full pass plus targeted repair produced valid candidates for **31/33 adapters**; Bybit still cites the wrong financial row and tier, and Jupiter emits conflicting FX rules in the same scope. Formal validity does not resolve the source disagreements above. See [live validation](live-validation.md) for complete outcomes.

The first medium-reasoning full run, prompt 26, attempted all 33 active adapters for **$0.50205312**: 28 valid candidates and five failures. It retained all 17 earlier accepted cards, including archived Ready. Failures exposed opaque draft context (Coinbase/Crypto.com), wrong-row correction feedback (Bybit), explicit no-fee grammar (Nexo), and a PostgreSQL connection timeout under concurrent verification load (Tria). The final acceptance run and audit are recorded in [live validation](live-validation.md).

Earlier offline recovery used six manually corrected inputs (Ethena, Exa, Jupiter, Karta, Kolo and Kraken) plus unchanged recorded Revolut output. The subsequent fresh full run generated valid candidates for all seven without injecting those corrected outputs. Historical offline reports remain distinct from paid results.

Native source DNS and actual Coolify deployment remain separate acceptance requirements. Source/citation validation does not prove that every source fact or interpretation is complete. See [validation status](validation.md).
