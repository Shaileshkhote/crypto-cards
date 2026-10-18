# Evaluation status

The candidate `openai/gpt-4.1-mini` has been live-tested through OpenRouter's OpenAI route and **has not met production acceptance**. The latest prompt passes five of six labeled synthetic cases, missing an explicit issuer fact. Real-provider snapshot runs expose incomplete output, schema violations, invalid citations and an unsupported inference in a technically successful publication. See [live validation](live-validation.md). No real-provider accuracy or 50-provider budget claim is approved. The uploaded archive contains source inventories and legacy code, not a hand-verified extraction corpus. Legacy conditional parsing results are not ground truth.

Six synthetic regression scenarios cover regional percentages, zero fees/false features, tiered ATM allowances, capped rewards, unknown calculation, and multiple tiers. Unit and PostgreSQL tests validate preservation, evidence, cache identity and review behavior. Mock model calls test tool schemas, bounded steps and usage accounting; their costs are simulated and are not OpenRouter charges.

Before selecting a production model, label 5–8 varied real providers. Suggested imported seeds: EtherFi, Avici, MEXC, Gnosis Pay, Nexo and Revolut. Include actual HTML, text/image PDFs, JavaScript pages, country scopes, tier names, fees, caps and exact evidence blocks, with source URLs and verification dates. Human labels must distinguish real source facts from the archive's dataset policies.

With source network access, a dedicated benchmark database and a securely injected OpenRouter key:

```sh
pnpm benchmark etherfi avici mexc gnosis-pay nexo-card revolut
```

The command runs forced and warm syncs through the real shared core, writes `.local/benchmark.json`, and reports measured token/cost/status/latency. Both passes share one $5 run budget; failed adapters are reported, and the 50-provider estimate is omitted when any cold sync fails. It may generate review records and publications, so use a dedicated database. Compare successful outputs manually with the labeled corpus, record precision/recall by field and scope, and record the actual model/provider route. Estimate total cost only from completed representative runs; failed runs and unextracted pages invalidate blanket claims. Set provider-side spend controls because application reservations cannot guarantee billing behavior.

On this cloud machine, `NODE_USE_ENV_PROXY=1` enables the OpenRouter HTTPS transport. The machine's DNS resolver still returns `EAI_AGAIN`, so native crawler public-address validation cannot complete. Proxy-fetched source snapshots were tested separately; they do not establish a complete native crawl. Use a machine with functioning DNS for the native benchmark.

Production deployment, a complete native benchmark, off-host backup configuration and a production backup restore require operator access and are separate from the local implementation checks. The validation report records the checks actually run in this cloud task.
