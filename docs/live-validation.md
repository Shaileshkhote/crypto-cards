# Live validation — 2026-10-18 UTC

Application checks pass; real ingestion has not met acceptance. No production data or deployment was used. The OpenRouter credential was passed only to temporary processes and was not saved to files, commits, PR text or environment settings.

## Application checks

- `pnpm check`: TypeScript, ESLint and all 50 tests pass, including nine PostgreSQL integration tests.
- `pnpm build`: production Next.js build passes.
- HTTP: health, four authenticated admin screens, anonymous admin rejection, public write rejection, card detail JSON and ETag/304 pass.
- System Chromium: quoted review evidence displayed; a 2% → 2.5% fee remained out of the public cache until approval, then changed the payload and ETag. Five screens fit a 390px viewport.
- A separately running worker completed a PostgreSQL cache job. A real custom-format database dump restored into a separate database with matching card/version counts and publication hashes.
- Signed JWT checks cover a valid identity plus expiry, audience, issuer, allowlist and forged-signature rejection. These use a local signing key and mocked JWKS response; a real Cloudflare deployment remains untested.
- PDF text extraction and textless classification pass. A separate test terminates an actual CPU-stuck worker thread at the parser deadline.

## Source access

Native crawler attempts covered all 36 adapters and 446 configured URLs. The machine DNS resolver returns `EAI_AGAIN`, preventing public-address validation before an HTTP request. Those checks remained enabled; native end-to-end crawling did not pass.

An independent HTTPS audit used the environment proxy, exact configured host allowlists, redirect checks, robots rules and crawl delays. It fetched 402/446 URLs. This audit does not verify the native DNS-dependent crawler. Parsing left 399 usable snapshots: two PDFs hit the 20-second deadline and one HTML page required browser rendering.

| Unavailable/restricted source reason | URLs |
| --- | ---: |
| Cannot verify robots.txt: HTTP Error 403: Forbidden | 9 |
| Cannot verify robots.txt: HTTP Error 406: Not Acceptable | 4 |
| Disallowed by robots.txt | 15 |
| HTTP Error 404: Not Found | 14 |
| HTTP Error 406: Not Acceptable | 1 |
| Untrusted redirect | 1 |

## Live model checks

The route was `openai/gpt-4.1-mini` through OpenAI, with no provider fallback. The latest prompt/schema hint version is 3. Tests use real OpenRouter tool calls, strict structured output, runtime validation and exact quote/block checks.

| Labeled synthetic case | Latest result |
| --- | --- |
| regional | passed |
| zero | passed |
| tiered | passed |
| rewards | passed |
| unknown | failed — explicit issuer omitted |
| tiers | passed |

The earlier prompt passed all six synthetic cases; the latest passes five of six (10 of 11 field assertions). This is evidence of an unresolved recall problem, not an accepted accuracy result. There is no verified real-provider precision/recall corpus yet.

Two full forced snapshot passes tested all 36 providers. The first completed two technical publications (Ready and Vaultleap); both warm passes made zero model requests and returned unchanged. The final pass returned 34 failures, one pending review (Ready), and one publication (RedotPay). Both final warm passes made zero model requests; RedotPay remained unchanged and Ready remained pending review. These are database/extraction outcomes, not accuracy scores. The final pass uses the first pass's accepted benchmark data as its base; existing changes remain reviewable.

The final pass made 67 model requests and used $0.268518 in application accounting. Combined accounting for diagnostics, both synthetic passes and both provider passes is $0.624138, including two rejected-request reservations. The combined test budget stayed below $5. No 50-provider cost estimate is valid because most runs failed.

A Ready spot check found `physical: false, virtual: false` supported only by “At the moment, Ready Cards are not available to order.” Ordering unavailability does not establish those physical/virtual flags. Exact quotation alone is insufficient to establish a claim. This publication exists only in the dedicated benchmark database and is not approved production data.

| Provider | HTTP fetched/configured | First forced sync | Final forced sync | Final warm model requests | Final result/reason |
| --- | ---: | --- | --- | ---: | --- |
| avalanche-card | 1/5 | failed | failed | — | robots fetch blocked |
| avici | 12/12 | failed | failed | — | Invalid evidence |
| bitget-wallet | 9/9 | failed | failed | — | Invalid evidence |
| bitunix | 9/9 | failed | failed | — | Model marked incomplete |
| bybit | 17/17 | failed | failed | — | PDF deadline |
| coinbase | 18/21 | failed | failed | — | robots fetch blocked |
| crypto-com | 18/18 | failed | failed | — | Ambiguous limits identity; conflicting rules share a scope |
| ethena-pay | 8/8 | failed | failed | — | Schema validation failed |
| etherfi | 17/21 | failed | failed | — | Missing source (404) |
| exa | 21/21 | failed | failed | — | Schema validation failed |
| gnosis-pay | 1/16 | failed | failed | — | robots disallow |
| hyperbeat | 12/12 | failed | failed | — | Schema validation failed |
| jupiter-card | 4/4 | failed | failed | — | Invalid evidence |
| karta | 3/6 | failed | failed | — | robots fetch blocked |
| kast | 15/15 | failed | failed | — | Invalid evidence |
| kolo | 10/10 | failed | failed | — | Invalid evidence |
| kraken | 11/11 | failed | failed | — | Schema validation failed |
| metamask | 11/11 | failed | failed | — | Invalid evidence |
| mexc | 9/12 | failed | failed | — | robots fetch blocked |
| nexo-card | 7/7 | failed | failed | — | Model marked incomplete |
| payitfast | 10/10 | failed | failed | — | Invalid evidence |
| phantom-cash | 9/9 | failed | failed | — | Schema validation failed |
| picnic | 20/20 | failed | failed | — | Schema validation failed |
| plasma-one | 16/17 | failed | failed | — | Missing source (404) |
| ready | 8/8 | published | review | 0 | Completed; accuracy not approved |
| redotpay | 25/25 | failed | published | 0 | Completed; accuracy not approved |
| revolut | 10/10 | failed | failed | — | PDF deadline |
| robinhood-gold | 13/13 | failed | failed | — | Agent tool limit exceeded |
| ruvo | 3/3 | failed | failed | — | Invalid evidence |
| safepal | 13/14 | failed | failed | — | robots fetch blocked |
| solayer | 8/8 | failed | failed | — | Invalid evidence |
| solflare | 0/8 | failed | failed | — | Missing source (404) |
| tria | 16/17 | failed | failed | — | Untrusted redirect |
| tuyo | 13/13 | failed | failed | — | Invalid evidence |
| vaultleap | 11/11 | published | failed | — | Model marked incomplete |
| wirex-one | 14/15 | failed | failed | — | Missing source (404) |

## Remaining acceptance work

Repair or replace stale source inventories with verified public sources, use a machine with working DNS, and rerun the native crawler. Complete browser-required pages and obtain usable versions of restricted or timing-out PDFs. Evaluate model coverage and citations against manually labeled real-provider fixtures before selecting a production model. Schema, evidence and incomplete-output failures continue to prevent publication.

Fresh Docker images after these fixes and a complete three-service Compose run remain unverified because the earlier full build exhausted the cloud machine’s 32 GB VFS filesystem. Individual image checks predate these fixes. Coolify deployment, HTTPS routing, real Cloudflare Access, off-host backups and a production restore remain untested.

GitHub CI also exposed an HTTPS CA bootstrap failure in the worker image. The browser stage now uses Node's bundled trusted roots, plus the optional build proxy CA, until the OS CA package is installed. TLS and APT package signatures remain verified; the fix is being checked in CI.

Raw source snapshots, detailed model usage, synthetic outputs and benchmark database bindings remain in ignored `.local` artifacts. They are not committed. Reproduce the native workflow with `pnpm benchmark` against a dedicated database once DNS/source access works; cold and warm passes share one capped budget.
