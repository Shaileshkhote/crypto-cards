# Six-card source investigation — 19 October 2026

All 67 configured URLs for Bybit, Jupiter, KAST, MEXC, Payitfast and Bitget Wallet were freshly fetched through the environment HTTPS proxy, with TLS verification, trusted redirects and robots checks. All 67 parsed successfully. This is source research, not a successful native crawler or live model benchmark.

## Bybit

The official [fees and spending limits](https://www.bybit.com/en/help-center/article/Fees-and-Spending-Limits-Bybit-Card) page uses merged table cells. Flattening cells without expanding `rowspan`/`colspan` lost region alignment and subheaders. The shared parser now preserves both. The extractor's financial retrieval also recognizes ISO-currency amounts such as `10,000 USD`, rather than recognizing only symbols and percentages.

The adapter now names the actual Asia Pacific Tier 1/2/3 and Australia Tier 1/2 identities. Existing identities remain for accepted-data retention. No limit prices or guessed Lite/Base/Advanced aliases were inserted into static data. Initial previews include limit rows alongside fees. Evidence must still match the exact cited row; none is automatically reassigned to a convenient block.

## Jupiter

The [official fee schedule](https://docs.jup.ag/user-docs/global/spend/fees-and-limits) distinguishes Rain purchase FX (1% on non-USD payments) from the ATM-specific FX surcharge ($0.30 plus 1%). The latter is a compound, non-calculable fee with an explicit ATM condition; it must not share an unqualified scope with purchase FX. DCS has a separate 1.8% purchase FX rate.

Hydration had replaced a model's valid short ATM clause with the entire table, erasing its service qualifier from correction feedback. Source-supported clauses now remain intact; invented descriptions still fall back to the cited source text. Same-block scope collisions continue to require correction.

## Payitfast

The [pricing page](https://payitfast.com/pricing) advertises 1% non-USD FX, but its closing provision says applicable terms prevail in any inconsistency. The [master terms](https://payitfast.com/master-terms), effective 29 September 2026, explicitly place product-specific terms above the fee schedule. The [card terms](https://payitfast.com/card-terms), whose heading displays 31 August 2026, state a 2.2% non-USD FX fee.

For the same card, fee and scope, the adapter therefore declares card terms above pricing through `sources.metadata.supersedes`. This is an explicit contractual precedence decision, not a rule that legal pages or newer articles always win. The shared reconciliation keeps the authoritative typed claim and the pricing alternative as independently cited terms. It does not add the competing percentages together or invent separate provider/network components. Existing accepted prices remain held for review and become unconfirmed when fresh evidence differs.

## KAST

The [detailed help article](https://concierge.kast.xyz/hc/en-us/articles/11290428597647-What-Are-the-Daily-Spending-and-ATM-Withdrawal-Limits-on-My-KAST-Card) displays an update on 17 October 2026 and gives $500 per withdrawal and $1,500 across three transactions in a rolling 24-hour window. The [product overview](https://www.kast.xyz/crypto-cards) still gives $250 / $750.

An update date alone does not establish which limit governs every card. No unsupported precedence is declared. Competing monetary limits become separately cited terms with disputed typed amounts omitted. Accepted limits stay present as unconfirmed. Other supported, non-conflicting facts remain usable.

## MEXC

The [application guide](https://www.mexc.com/support/article/how-to-apply-for-mexc-card-apac-400415248342093824), dated 1 September 2026, calls a 1% charge a “spending fee.” The [detailed comparison](https://www.mexc.com/support/article/understanding-the-mexc-card-446453561133852672), dated 14 October 2026, distinguishes a 0% APAC purchase transaction fee from a crypto-conversion charge. A generic spending charge must not be invented as an additional purchase fee merely because its label differs.

The comparison itself is inconsistent: its crypto-conversion table says 0%, while its explanation and worked examples say 1%. Consequently a clean single conversion rate cannot be asserted from this page. Claims from the table and prose retain separate citations; unresolved rates become narrative uncertainty. Distinct transaction, conversion and FX charges retain their actual kinds and scopes.

## Bitget Wallet

The [current card page](https://web3.bitget.com/card) expressly includes Singapore and mainland China in application availability. The [migration/reward page](https://web3.bitget.com/card-reward) also describes card applications but omits them. That omission is not an explicit prohibition. Both pages remain configured and their country/application topics are declared.

The extractor must cover independently stated application lists before completing a multi-source eligibility extraction. Incompatible complete lists become separately cited terms instead of an arbitrary union or intersection. Physical-card availability must retain its physical-card context. Where authority is not established, accepted eligibility remains unconfirmed rather than silently being replaced.

## Validation boundary

Schema 8 / prompt 31 / merge 15 includes these changes. Tests exercise omitted competing sources, currency-code limits, table spans, ATM-versus-purchase scope correction, internal table/body contradictions, contractual precedence, non-conflicting fee retention and accepted-value preservation. Cached source records do not substitute for a fresh paid run of this profile.

No paid calls have been made for this repair. The remaining additional-allocation budget is $4.165581110, including the conservative reservations already accounted for. A fresh live model run requires a securely supplied `OPENROUTER_API_KEY`; the previous temporary session is closed and no saved binding exists. Existing schema/citation/financial checks, request limits, budget ceilings and review requirements remain enforced.
