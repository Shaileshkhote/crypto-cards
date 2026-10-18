# Architecture

`apps/admin` is Next.js with four admin screens and a separate read-only public cache API. Admin server actions call `core/jobs` and `core/review`. They never run extraction. `apps/worker` provides the CLI and long-running PostgreSQL job poller. Both use the same core functions; only the worker imports the job executor.

`packages/core` contains schemas, adapter loading, crawler, the universal OpenRouter tool loop, deterministic merge, sync, review, jobs, and cache projection. `packages/db` contains a thin parameterized SQL layer and transactional, advisory-locked migrations. There is no per-provider executable scraping code or additional queue service.

## Sync and publication

1. Validate all adapter files and source trust boundaries.
2. Fetch configured sources with robots checks, bounded global concurrency and per-domain serialization/delay. Discovery is disabled by default. Network failures update source health and preserve the last successful snapshot.
3. Normalize documents into stable content hashes and quoted blocks. HTML tables preserve headings and rows; text PDFs use PDF.js. Image PDFs remain pending transcription. Browser rendering is explicit and restricts scripts to trusted domains and content requests to configured URLs.
4. Look up per-source extraction fingerprints including model, provider, prompt, schema, parameters, adapter hints, and effective URL inventory. Static data is excluded, so static edits do not invalidate model work.
5. Run one bounded agent on the changed/missing extraction set. Its only tools are listPages, searchDocs, readPage. Discovery requests go through the crawler, and discovered URLs are retained with source snapshots. Invalid, conflicting, incomplete, or over-budget output is rejected.
6. Verify evidence against stored document blocks, resolve known identities, and normalize rule IDs from provider/product/tier/kind/scope. Assemble source facts in deterministic order, then apply explicit static values.
7. Preserve unrelated accepted facts. Existing value edits and possible scope/identity replacements are held. Safe additions publish with a version check. Evidence accompanying held values stays pending too. Missing fields remain present and are marked unconfirmed; fetch failure never implies absence or zero.
8. Insert the publication and immutable version in one transaction. A review records the base version and changes. Approval applies only those paths; rejection leaves the publication alone. Concurrent version changes prevent stale approval.
9. Rebuild all cache projections from committed cards in a separate transaction. Cache failures leave good publications intact and are reported as failures/mismatches until rebuilt.

The current cache rebuild scans all published providers; for a directory of roughly 50 providers this keeps it small and consistent without introducing cache infrastructure. Source extraction is incremental at document level. Cross-source contradictions fail the adapter run instead of arbitrarily choosing a value. Resolve incorrect scope/identity hints or review the sources before retrying.

## Jobs and costs

A single worker claims jobs with `FOR UPDATE SKIP LOCKED`. PostgreSQL advisory locks serialize active jobs and per-provider syncs, including direct CLI invocations. The worker writes health heartbeats during long work. Interrupted jobs become failed after ten minutes and require an explicit retry; they are not silently recharged.

Each sync invocation owns one Budget capped at $5 (or a smaller configured limit). The agent fetches current model prices, reserves a conservative byte-based input and maximum-output cost before each request, and settles returned usage/cost. Requests with missing usage or uncertain network outcomes consume their reservation conservatively. No automatic retries or provider fallback chain is used. A provider billing discrepancy stops the run; application estimates do not establish an absolute provider-side billing cap. Configure OpenRouter account/key spend limits too.

## Operational boundaries

Admin authorization is verified server-side by both the request proxy and every action. Basic auth uses constant-time digest comparison; Cloudflare Access mode verifies signature, issuer, audience, expiry, and allowlisted email. The browser never receives model credentials. Public cache routes export only GET; they do not expose pending candidates, jobs, or source snapshots.

Seven domain tables use JSONB for canonical payloads; an eighth `schema_migrations` table tracks operational migrations. Version history supports audit/rollback reconstruction, but is not a backup. See the off-host backup and restore procedure.
