# Source maintenance

The original import contained 36 providers and 446 URLs. The maintained inventory contains the same 36 providers and 436 URLs. Changes below were checked against public provider pages on 2026-10-18; no legacy adapter code was used.

| Provider | Update | Reason |
| --- | --- | --- |
| EtherFi | Replace removed club, physical-card and staking articles with current membership/physical-card articles; consolidate the country page | Official help sitemap links current articles. Replacement pages returned HTTP 200. |
| Solflare | Replace eight removed card articles with the current official card-pause announcement | Old articles returned 404. The current card collection links the announcement. Existing retirement metadata remains in configuration; disappearing pricing is not treated as zero. |
| SafePal | Remove the unavailable Fiat24 countries API | Official SafePal country/banking pages remain configured and readable. Do not infer a replacement country list. |
| Plasma One | Remove the disappeared $10 referral bonus article | Current fee, reward and referral terms remain configured. An expired promotional URL must not block otherwise accessible documentation or establish a current bonus. |

Known access issues remain visible: Gnosis Pay help explicitly disallows this crawler; Wirex has a stale country URL whose apparent replacement is blocked by this cloud network; Tria has a JavaScript page and a referral redirect outside its declared domains. These require an accessible official source or provider permission. The crawler does not bypass explicit robots rules or silently reuse stale material as a successful fresh fetch.

On this machine the native DNS resolver returns EAI_AGAIN for public source hosts. Independent HTTPS proxy snapshots help test parser/model behavior, but do not establish native crawler success. A source failure preserves the previous accepted card and records the error.
