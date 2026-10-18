# Evaluation status

The initial model `openai/gpt-4.1-mini` is a configurable starting point, **not a measured selection**. No real extraction accuracy or 50-provider budget claim is made until a live benchmark completes. The uploaded archive contains source inventories and legacy code, not a hand-verified extraction corpus. Legacy conditional parsing results are not ground truth.

Six synthetic regression scenarios cover regional percentages, zero fees/false features, tiered ATM allowances, capped rewards, unknown calculation, and multiple tiers. Unit and PostgreSQL tests validate preservation, evidence, cache identity and review behavior. Mock model calls test tool schemas, bounded steps and usage accounting; their costs are simulated and are not OpenRouter charges.

Before selecting a production model, label 5–8 varied real providers. Suggested imported seeds: EtherFi, Avici, MEXC, Gnosis Pay, Nexo and Revolut. Include actual HTML, text/image PDFs, JavaScript pages, country scopes, tier names, fees, caps and exact evidence blocks, with source URLs and verification dates. Human labels must distinguish real source facts from the archive's dataset policies.

With source network access, a dedicated benchmark database and a securely injected OpenRouter key:

```sh
pnpm benchmark etherfi avici mexc gnosis-pay nexo-card revolut
```

The command runs forced and warm syncs through the real shared core, writes `.local/benchmark.json`, and reports measured token/cost/status/latency. It has a shared $5 cold-run budget and a separate warm-run budget; failed adapters are reported. It may generate review records and publications, so use a dedicated database. Compare successful outputs manually with the labeled corpus, record precision/recall by field and scope, and record the actual model/provider route. Estimate total cost only from completed representative runs; failed runs and unextracted pages invalidate blanket claims. Set provider-side spend controls because application reservations cannot guarantee billing behavior.

Production deployment, real OpenRouter benchmark, off-host backup configuration and a real backup restore require operator access and are separate from local implementation verification. The validation report records the checks actually run in this cloud task.
