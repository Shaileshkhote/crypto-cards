# Source maintenance

The original import contained 36 providers and 446 URLs. The maintained inventory contains the same 36 providers and 433 URLs. Changes below were checked against public provider pages on 2026-10-18; no legacy adapter code was used.

The active inventory is now **33 adapters / 396 URLs**. SafePal, Gnosis Pay and Ready are retired and excluded from ingestion; their 37 configured URLs remain archived in the inventory. The full-inventory audit below predates this exclusion. Gnosis's archived robots failures no longer block an active inventory run.

| Provider | Update | Reason |
| --- | --- | --- |
| EtherFi | Replace removed club, physical-card and staking articles with current membership/physical-card articles; consolidate the country page | Official help sitemap links current articles. Replacement pages returned HTTP 200. |
| Solflare | Replace eight removed card articles with the current official card-pause announcement | Old articles returned 404. The current card collection links the announcement. Existing retirement metadata remains in configuration; disappearing pricing is not treated as zero. |
| SafePal | Remove the unavailable Fiat24 countries API | Official SafePal country/banking pages remain configured and readable. Do not infer a replacement country list. |
| Plasma One | Remove the disappeared $10 referral bonus article | Current fee, reward and referral terms remain configured. An expired promotional URL must not block otherwise accessible documentation or establish a current bonus. |

Additional maintenance on 2026-10-19 (Asia/Kolkata):

| Provider | Update | Reason |
| --- | --- | --- |
| Wirex One | Replace the obsolete country URL with the current official Freshdesk supported-countries article; remove its duplicate legacy help URL | The official help search links article 76000088412, which returned HTTP 200 and contains the current country table, verification and self-custody information. |
| Tria | Remove the empty JavaScript homepage from extraction and the obsolete referral blog redirect | Fifteen official product, fee, membership, terms and help sources remain, including the current Season 3 points/referral article. The website identity stays in config. An inaccessible old campaign is not treated as a current benefit. |

The earlier HTTPS proxy audit requested every one of the 433 configured URLs: 418 succeeded; the remaining 15 are Gnosis Pay help pages whose robots policy explicitly disallows this crawler. Gnosis requires an accessible official source or provider permission. The crawler does not bypass explicit robots rules or silently reuse stale material as a successful fresh fetch.

On this machine the native DNS resolver returns EAI_AGAIN for public source hosts. Independent HTTPS proxy snapshots help test parser/model behavior, but do not establish native crawler success. A source failure preserves the previous accepted card and records the error.

The 2026-10-19 active-inventory refresh fetched **396/396 active URLs** through the approved HTTPS proxy. All 16 active PDF documents parsed with the shared bounded Poppler parser; none of the active snapshots was unavailable. Ready was excluded after its retirement request. These fresh snapshots support the new paid model run; they do not establish native DNS/crawler success.

The shared list-context parser was applied to the same fresh snapshots. It changed 116 documents across 25 providers while preserving all original text tokens. This restores introductory fee/period context to list-row citations; it does not supply new prices or reinterpret provider sources.

Table-cell line breaks and block paragraphs are now separated before table rows are normalized. The earlier parser joined labels such as `Free ATM<br/>withdrawals`, hiding their financial meaning. All 396 active snapshots, including 16 PDFs, were reparsed with the corrected shared parser; none was unavailable. This is a source-text fix and does not add provider-specific prices or instructions.

The six-card investigation freshly fetched and parsed **67/67 URLs** for Bybit, Jupiter, KAST, MEXC, Payitfast and Bitget Wallet through the approved HTTPS proxy. The shared table-span fix changed five of their 63 HTML documents; no previously present word or numeric token disappeared and all blocks remained within 1,600 characters. Four PDF documents also parsed successfully. These conservation checks do not prove semantic accuracy or native crawling. See [source decisions](source-decisions.md).
