# Validation status

The implementation is in draft PR #1 on `codex/phase-1-crypto-cards`. It has not been merged or deployed to Coolify. **Complete production ingestion acceptance remains open.** Model and budget failures are reported rather than masked.

- Node 24 / pnpm 11.25 frozen installation and adapter validation pass: 36 providers, 433 URLs, three declarative files per provider.
- TypeScript, ESLint and 93 tests pass with disposable PostgreSQL integration. The production Next.js build passes. CI also tests the complete Compose stack, migrations, authenticated HTTP, cache jobs, restart persistence and dump/restore.
- Final HTTP checks cover all four admin screens, anonymous rejection, ETag/304, public POST denial and visible fee conditions/minimums/maximums/allowances.
- The final selected Luna/high profile passed 10/11 labeled cases; Avici's issuance prices remain untyped narrative. These short passages do not measure complete provider accuracy.
- The schema-6/prompt-20 medium-reasoning replay attempted the 36-provider inventory for $0.425622 under a $0.445 diagnostic cap. It published 10 providers; 9 unchanged passes made zero model calls. Other providers failed extraction/source checks or reached the test budget. The final schema-7/high profile still needs a complete inventory acceptance run.
- Bybit's tenth warm attempt exposed inconsistent ID normalization for repeated regional tier names. The final fix resolves normalized IDs and explicit aliases before ambiguous names. An offline replay of its 17 actual cached extractions now preserves publication byte-for-byte without model calls or changes.
- All published records pass the final schema and stored citation/numeric-evidence checks. Additional label checks exposed two missing/misclassified full-provider claims; formal validation alone is insufficient.
- The real replay dataset was restored into a separate database with matching counts and complete-row fingerprints across all eight tables. This proves stored-data preservation, not complete source extraction.
- The HTTPS proxy audit fetched 418/433 configured URLs. Fifteen Gnosis help articles deny the crawler. Native DNS fails even outside the process sandbox; native crawling remains unverified.
- Conservative accounting remains within allocation: **model tests $9.978259/$10; adapters $14.970552/$15; combined $24.948811/$25**.

See [live validation](live-validation.md) for every provider, exact settings, budget cutoffs and accounting. Remaining work includes source access/contradictions, complete field/scope accuracy, native crawling and production deployment/authorization/off-host backups. No model credential was committed, published in the PR or bound in saved environment configuration.

The cloud setup draft records reusable installation/start instructions, the final repository revision and the secret requirement. Review/save and publish it in environment settings to activate it.
