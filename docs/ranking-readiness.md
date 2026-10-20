# Offline ranking-data assessment

This is a data representation assessment, not a provider recommendation or completed simulator. The local DB still has 28 published providers. No published card becomes newly certified ranking-ready merely because a labelled fixture fits a richer schema. No paid calls or live re-extraction were performed.

The fourteen cases in `tests/fixtures/ranking-source-examples.json` were manually labelled from exact local source snapshots, not copied from the comparison API. Tests replay those prepared drafts through the real extractor with mocked transport; they do not measure how well a model will generate the new fields. Other tests cover invalid numbers/units, correction feedback, schema boundaries, conflict reconciliation, preservation and PostgreSQL review/cache round-trips.

| Provider | Newly representable from the saved blocks | What still prevents a complete automatic ranking |
| --- | --- | --- |
| Ethena Pay | Standard, Pro and VIP marginal monthly cashback schedules, including explicit fallback rates | Tier qualification, AVAX valuation and approximate non-USD network charges |
| MEXC | 4/6/10% rewards with 100/300/800 USDT monthly payout caps | M-Score qualification, token valuation and unresolved/overlapping purchase-fee claims; product/date applicability |
| Tria | Virtual, Signature and Premium spending thresholds with reduced rates above them, distinct from payout caps | Applicable plan/card fees, international fee bounds, optional staking boosts and programme validity |
| Phantom Cash | One international fee containing both USD 0.30 and 1% | Transaction count and merchant location; missing annual-fee amount and unconfirmed reward coverage |
| VaultLeap | Separately cited USD 50 monthly payout cap | Rate/cap provenance linkage and qualification, plus approximate FX; cap-only fixture remains non-calculable |
| PayitFast | Separately cited USD 60 / USD 1,500 monthly caps | Independently sourced rate, app/promotional exceptions, Elite eligibility and overlapping FX/cross-border applicability; cap-only fixtures remain non-calculable |
| Picnic | Explicit 2026-01-31 expiry for the old programme without inventing a rate | A current purchase cashback programme and complete purchase/conversion fees |

Jupiter standard Rain/DCS and narrowly defined Robinhood scenarios remain the strongest previously identified starting estimates, subject to issuer/account/redemption assumptions. They are not newly recovered by this work. Neither has undergone complete calculator acceptance testing here.

The other published providers (Avalanche, Avici, Bitget Wallet, Bitunix, Crypto.com, Exa, Hyperbeat, Karta, Kolo, Kraken, MetaMask, RedotPay, Ruvo, Solayer, Solflare, Tuyo, Wirex One and Nexo) have not been re-extracted under prompt 43. Their prior fee/reward applicability, coverage, cap or valuation gaps remain. Bybit, Coinbase, EtherFi, KAST and Revolut still have no published local record because of source-access failures.

To certify a card later, review a complete accepted fee/reward set for a declared scenario. Resolve retained conflicts and conditions using cited source evidence; do not infer absent fees or rewards as zero. This work adds no readiness gate or separate service. The existing review workflow remains the path for financial changes. Live extraction quality, production deployment and the original cloud data remain unverified.
