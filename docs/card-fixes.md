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

Schema **8 / prompt 22** is the current contract, using the selected Luna/high model setting. It has not received a new paid whole-provider or labeled model evaluation. The earlier 10/11 model score belongs to schema 7 / prompt 21.

## Checks and remaining work

TypeScript, ESLint and **107 tests**, including PostgreSQL integration, pass. Nine manually reviewed source-excerpt fixtures cover the new representations. Additional tests exercise repeated tool reads, conditional-price sorting and a material-fee price change held until version-checked approval. The production build and CI results are recorded on the PR.

Some failures remain real source or output problems: Bitget's eligibility lists differ; MEXC's sources state different APAC transaction fees; KAST states both $250 and $500 per ATM withdrawal; Payitfast's official charges conflict. Other saved outputs need corrected scopes, citations or complete responses. Gnosis help pages still disallow the crawler. No source was removed and no conflicting price was selected merely to make a candidate pass.

A fresh full inventory run with functioning native DNS, source access and the final model contract remains required. The hard $4.99 invocation ceiling is unchanged; a complete successful ingestion below $5 is not yet demonstrated. Conservative accounting remains **$9.978259/$10** for model testing and **$14.970552/$15** for adapters, **$24.948811/$25** combined.
