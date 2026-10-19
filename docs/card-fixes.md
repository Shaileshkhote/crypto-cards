# Remaining-card fixes — 19 October 2026 (IST)

The shared ingestion code now represents the conditions that caused several card candidates to collide. Verification used saved source snapshots and recorded responses, with **no additional OpenRouter requests or spending**. These results are separate from a fresh model benchmark or production deployment.

## Verified recovery

An offline replay through the extractor's current decoder and publication validator accepts Revolut's previously rejected recorded output without editing its extracted values. Six other full candidates validate after manual review corrected their source interpretation:

| Card | Verified correction |
| --- | --- |
| Ethena Pay | Monthly spending bands have separate conditions; yield and referral rewards have distinct program kinds. |
| Exa | `$00.00` normalizes to zero. Complementary feature lists combine across pages. The ambiguous weekly limit `10.000$` remains non-calculable source text. |
| Jupiter Card | Rain and DCS issuers stay on their respective tiers. Issuer-assignment and reward-balance explanations remain cited terms. |
| Karta | Metal and plastic companion-card prices have separate conditions. Cash advances are distinct from ATM withdrawals. |
| Kolo | Card-payment conversion and stablecoin conversion retain separate conditions, as do first-30-day and later cashback rules. |
| Kraken | Cashback and salary matching have separate program identities. |
| Revolut | Explicit wording such as “without any fees” supports zero instead of failing numeric evidence validation. |

The six manually corrected inputs are not fresh model successes. Corrected source scopes demonstrate that the application can represent and publish these facts; they do not establish that the final model will produce every correction automatically. The original replay reports remain historical measurements.

The publication check cloned the earlier disposable database containing ten cards. It used the shared sync, candidate, publication, review and cache functions with explicitly labeled offline extraction records. Seven previously unpublished cards were published, bringing that copied dataset to **17 cards**. Of the ten existing cards, five cold passes were unchanged and five held differences for review. No reviews were approved. Recursive checks confirmed that accepted values from **all ten original cards were retained**.

All **17/17 warm passes** were unchanged, used cached extraction without calling the fixture extractor, and produced byte-identical cache payloads. This proves repeatability and retention for these stored inputs, not source-fact completeness or native crawling.

## Shared code changes

- Decimal money accepts padded source strings and normalizes leading/trailing zeros; signed, exponent, comma-formatted and incomplete decimal strings remain rejected. Evidence comparisons normalize padded numbers too. Ambiguous thousands/decimal notation is not interpreted automatically.
- Explicit no-charge and current fee-waiver wording can substantiate zero. Currency evidence remains required for typed money. Possible or refused waivers do not substantiate zero. These checks are not a semantic proof of all conditions.
- `scope.conditions` preserves explicit applicability that lacks a dedicated typed field. Conditions participate in stable rule identity. Numeric sorting excludes these rules because the directory has no context to evaluate them. Genuine conflicting prices without different sourced conditions still fail.
- Reward kinds distinguish cashback, salary matching, yield, referral and other programs. Cash advances have their own fee kind. Payment-rail spelling normalizes underscore/case variations to lowercase kebab case.
- Feature observations are additive across pages, like terms and requirements. Country eligibility lists from different sources must still agree; explicit empty/nonempty conflicts still fail.
- Repeated tool results reference text already in the conversation. A truncated search excerpt does not hide the full block from a later page read. This removes the reproduced Coinbase context overflow without raising the context bound or dropping source text; that recording still requires a corrected response with explicit rule scopes.
- Validation errors identify the conflicting rule, conditions and values. Extraction guidance distinguishes tier-specific issuers, program dates from campaign dates, and separate reward programs.

Schema **8 / prompt 23** is the current contract, using the selected Luna/high model setting. It has not received a new paid whole-provider or labeled model evaluation. The earlier 10/11 model score belongs to schema 7 / prompt 21.

## Checks and remaining work

TypeScript, ESLint and **124 tests**, including PostgreSQL integration, pass. Fifteen manually reviewed source-excerpt fixtures cover the representations; four additional source-disagreement fixtures check citation retention and accepted-value preservation. Additional tests exercise repeated tool reads, conditional-price sorting and a material-fee price change held until version-checked approval. The production build and CI results are recorded on the PR.

Some failures remain real source or output problems: Bitget's eligibility lists differ; MEXC's sources state different APAC transaction fees; KAST states both $250 and $500 per ATM withdrawal; Payitfast's official charges conflict. Other saved outputs need corrected scopes, citations or complete responses. Gnosis help pages still disallow the crawler. No source was removed and no conflicting price was selected merely to make a candidate pass.

SafePal, Gnosis Pay and Ready were subsequently retired by adapter configuration. They are excluded from active runs and counts; the remaining active inventory contains 33 adapters and 396 URLs. The earlier Gnosis access failure is historical, not an active-provider blocker.

A fresh full active-inventory run with functioning native DNS, source access and the final model contract remains required. The hard $4.99 invocation ceiling is unchanged; a complete successful ingestion below $5 is not yet demonstrated. Conservative accounting remains **$9.978259/$10** for model testing and **$14.970552/$15** for adapters, **$24.948811/$25** combined.

## Follow-up on the unresolved active cards

Prompt 23 keeps the same strict schema. Missing financial scopes are reported together in one correction instead of exposing only eight paths per turn. It does not fill missing scopes with `{}` automatically. Financial evidence errors now identify the fact, rule, target and exact citation, and report failures across the candidate together. Country-list conflicts show which source differs and the differing values (Bitget's saved disagreement includes CN and SG).

Search results show text around a matching term instead of always showing the first 600 characters. They include the block offset for a full page read and a truncation flag. Different excerpts from the same block remain available; a partial excerpt cannot hide a later full read. Context, request and spending bounds are unchanged. Compose now defaults to the selected Luna model and $4.50 budget, matching the CLI and `.env.example`.

Guidance and source-reviewed tests distinguish debit/credit funding, standard/fast ACH, swap direction, free ATM allowances, approximate partner charges versus provider markup, and crypto units versus fiat currencies. A genuinely disputed value can stay as independently cited narrative clauses while other facts remain usable. The application still rejects competing typed prices, and omission cannot erase accepted values. Product-level narrative additions follow the existing review policy.

Four saved disagreements are explicitly covered without an authority decision:

| Card | Saved source disagreement |
| --- | --- |
| KAST | Help article: $500 per withdrawal; product page: $250. |
| MEXC APAC | Comparison table: 0% transaction fee; application article: 1% spending fee. |
| Payitfast | Pricing: 1% non-USD FX; card terms: 2.2%. |
| Bitget Wallet | Main card page includes Singapore/mainland China; reward page's application list omits them. Neither the URL nor an omitted country establishes a safe eligibility interpretation. |

A replay of the stored responses under prompt 23 still has **17 valid candidates, 17 unresolved active cards and two retired adapters skipped**. Six of those 17 valid candidates still use the earlier manually reviewed inputs. The replay cannot generate corrected responses that are absent from the recording. Improved validation feedback and new representation tests are not new model successes. The seven budget-incomplete cards remain Plasma One, Robinhood Gold, Ruvo, Solayer, Tria, Tuyo and Wirex One; no new provider defect is inferred from a missing response.

The focused regressions and full **124-test** suite pass with PostgreSQL integration, TypeScript and ESLint; the production build passes. Three new labeled paid-model evaluation cases are prepared but unrun. Native DNS was rechecked for KAST, MEXC and Payitfast and still returns `EAI_AGAIN`. There were **zero additional paid model requests**, and the remaining original allocation cannot fund a meaningful complete acceptance run. Source authority decisions and a fresh complete run remain outstanding.

A subsequent prompt-23 offline publication check used a new copy of the 17-card dataset: accepted values were retained for 17/17 cards, and all 17 warm passes were unchanged with byte-identical caches. Two cold candidates stayed held for review; no reviews were approved and no model requests were sent.

Ready was subsequently retired through the same top-level adapter flag. It is excluded from new active runs, counts and public data; accepted facts and history remain archived. The active inventory now contains **33 adapters / 396 URLs**. Ready's two new-allocation evaluation cases had finished before the retirement request and remain historical accounting; the upcoming full run excludes Ready.
