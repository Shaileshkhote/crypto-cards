# Validation status

Production acceptance remains open. The implementation and fixes are in draft PR #1 on `codex/phase-1-crypto-cards`; they have not been merged or deployed to Coolify.

## Current checks

- Node 24 / pnpm 11.25.0 frozen dependency installation and adapter validation pass: 36 providers, 436 configured URLs, three data-only adapter files per provider.
- TypeScript, ESLint and all 66 automated tests pass with a dedicated PostgreSQL database. Coverage includes immutable review proposals, stale approval, failure preservation, exact evidence, deterministic publication, scoped sorting, service-specific fees, money versus count limits, PDF extraction and robots response handling.
- The Next.js production build passes. GitHub CI runs the same checks and the full Compose smoke test, including database migrations, authenticated HTTP, cache jobs, restart persistence and dump/restore. See the PR checks for the current commit's result.
- Model selection passed 8/8 labeled real-source cases. This is a small regression corpus, not a complete accuracy measurement. See [evaluation](evaluation.md).
- The final full-inventory snapshot replay published EtherFi and Revolut and reused both with zero warm model requests. Four providers exposed missing schema distinctions, now represented by schema 3. A final Avici retest reached the output bound; the final bounded output allowance was increased and still needs a live acceptance run. Three providers had source access failures; 27 were limited by the shared test budget. See [live validation](live-validation.md) for the exact boundary.
- Earlier real HTTP/browser checks covered all admin screens, anonymous rejection, review approval, mobile overflow, cache ETags, a separate worker and local backup restore. These do not establish a production deployment.

## Remaining acceptance

The native crawler is blocked on this cloud machine by failing public DNS. Gnosis Pay explicitly disallows the crawler, Wirex has an unavailable configured country page, and Tria needs JavaScript content/approved redirect sources. Accepted cards remain unchanged on such failures.

A complete native run on accessible official sources, full field/scope accuracy checks for schema 3, and production deployment remain required before calling ingestion production-ready. Coolify routing, production authorization, off-host backup scheduling and a production restore require deployment access. No real key was written to repository files, PR text or environment settings.

The cloud environment draft records the repository revision, reusable dependency/start instructions and the required secret name. Saving a draft does not publish it or bind the supplied testing key.
