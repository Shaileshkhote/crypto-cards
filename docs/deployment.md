# Coolify deployment and operations

Use one Git-backed Docker Compose application with `docker-compose.yml` as the source of truth. It defines exactly admin, worker, and postgres. Database and worker have no public port. Persistent PostgreSQL storage uses `postgres_data`.

1. Connect this Git repository to Coolify and select Docker Compose as the application build strategy. Use `docker-compose.yml` at the root.
2. Set `POSTGRES_DB`, `POSTGRES_USER`, a strong `POSTGRES_PASSWORD`, and matching URL-encoded `DATABASE_URL` using the internal hostname `postgres`. Supply `OPENROUTER_API_KEY` securely and choose `EXTRACTION_MODEL` after evaluation. The shared run budget defaults to $5.00 and cannot exceed $5.00.
3. Configure authorization before exposure. Recommended: put the domain behind Cloudflare Access, set `CF_ACCESS_TEAM_DOMAIN` (hostname only), `CF_ACCESS_AUD` and explicit comma-separated `ADMIN_EMAILS`. Tokens are cryptographically verified; a plain forwarded email header is insufficient. The public `/api/cache/*` and `/api/health` paths must be permitted separately by your Access policy if public cache access is desired. Alternatively set `ADMIN_AUTH_MODE=basic`, `ADMIN_USER`, and a random `ADMIN_PASSWORD` of at least 16 characters. Use HTTPS and never put credentials in URLs.
4. Route only `admin:3000` to an HTTPS domain. Admin waits for worker health, and the worker runs advisory-locked migrations and reconciles adapter retirement/public caches before polling. This is the single controlled migration command; admin never migrates. Do not run extraction in a Next.js HTTP request.
5. Deploy and inspect build/runtime logs and health checks. Verify admin login, queueing, review approval/rejection, cache ETags, and denial of anonymous writes. Schedule syncs with `docker compose exec -T worker pnpm cards sync --all` or a Coolify scheduled command; it calls the same core.
6. Configure nightly off-host database backups with retention and alerting. `BACKUP_DESTINATION=backup@host:/backups/cards bash scripts/backup.sh` streams a custom-format dump to a temporary local file and securely copies it off the host. Configure SSH credentials through deployment tooling, not Git. Prefer your managed backup provider/Coolify backup system when available. Download an off-host backup and run `bash scripts/restore-test.sh backup.dump` against the deployment to restore into a disposable separate database. Verify known card hashes/version counts as well as table counts. Schedule restore tests. Neither volume persistence nor version tables substitute for backups.

## Build and local smoke checks

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
docker compose config --quiet
docker compose build admin worker
docker compose up -d
docker compose ps
docker compose exec -T worker pnpm cards validate
docker compose exec -T worker pnpm cards status
```

To use the UI in a development cloud terminal, run PostgreSQL with a loopback-only port, set a loopback `DATABASE_URL`, migrate, and run `pnpm dev` plus `pnpm worker`. Alternatively provide a temporary Compose override binding admin `127.0.0.1:3000:3000` and PostgreSQL `127.0.0.1:55432:5432`; keep those bindings out of production Compose. Use the cloud platform's supported forwarding when available.

Readiness checks: `/api/health` returns 200 after migrations; an unauthenticated admin request returns 401; authenticated Overview and Cards render; an unauthenticated POST to public cache routes returns 405; a cache GET returns canonical JSON and the same ETag/304 on an unchanged rebuild. Queue a cache job and confirm a separate worker process completes it. For paid sync tests, start with one provider and a conservative OpenRouter-side spend limit.

Before declaring production complete, redeploy without removing the named volume and compare published hashes, restore a backup onto a separate database, verify TLS and Cloudflare Access (if selected), and perform a real source → candidate → review → approved cache workflow. Git-backed push/redeploy requires your actual repository and Coolify integration; neither code nor a local Docker build proves deployment happened.

Docker builds need registry, Debian package access and the platform's trusted CA/proxy configuration where applicable. Do not disable TLS/package verification. The worker installs Debian-signed Chromium and supplies its explicit path to Playwright. Browser rendering is opt-in and the crawler rejects data requests outside configured documents; some JavaScript sites will remain unreadable until appropriate explicit data URLs/trusted script hosts are configured. No challenge bypass, vision fallback, or provider-specific workaround is included.

An interrupted job becomes failed after an expired heartbeat. Retry explicitly. A stale review requires a fresh sync; never edit its base version in SQL. A committed publication with failed cache refresh is recoverable using `pnpm cards cache`.
