# Validation status

**Ingestion is not production-ready yet.** Ready, SafePal and Gnosis Pay are retired; **33 active adapters / 396 URLs** remain, with all configurations and historical data preserved.

- **147 tests and implementation CI pass**, including PostgreSQL integration, production build and the Compose job.
- Fresh Luna full replay plus targeted repair: **31/33 validated candidates**. Bybit and Jupiter fail. KAST, MEXC, Payitfast and Bitget also need source-conflict/scope resolution; formal validation does not establish complete extraction.
- Fresh labeled evaluation: **11/11 active cases**. Current records: **567 facts / 375 source extractions**, zero citation/financial-evidence errors.
- A separate cached pass of the **31 validated adapters** made zero model requests. One repeat EtherFi cache rebuild timed out; an isolated zero-cost recheck succeeded. The initial failure remains recorded. Pending reviews, immutable versions and public cache payloads stayed identical.
- Accepted values from **17/17 original cards** remain. Dump/restore preserved complete rows across all eight tables. No production database was used.
- Latest full attempt: **$0.189563670**, targeted repair **$0.087627770**, broader validation cycle **$2.996888155**. These failed/incomplete results do not prove complete ingestion below $5.
- Additional allocation conservative upper bound: **$5.834418890/$10**, separate from the earlier **$24.9488113742/$25**. No paid model work remains running.

Changed financial values require immutable, version-checked review. Missing or failed extractions preserve accepted values. Do not approve the unresolved candidates as complete.

Native crawling remains unverified because cloud DNS fails; actual Coolify deployment, production authorization/TLS and off-host backups are unverified. [Draft PR #1](https://github.com/Shaileshkhote/crypto-cards/pull/1) contains the code and has not been merged or deployed. See [live validation](live-validation.md), [card fixes](card-fixes.md) and [evaluation](evaluation.md).

The reusable cloud setup draft records startup instructions and the repository revision. Review/save and publish it in environment settings to activate it. Credential values are absent from Git, PR text and saved configuration.
