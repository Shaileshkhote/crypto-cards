# Crypto Cards

A TypeScript pnpm monorepo for extracting, reviewing, and publishing source-backed crypto card data. PostgreSQL is authoritative. The public JSON cache contains committed publications only. No spend simulator is included.

The supplied adapter archive was migrated into **36 providers, 446 source URLs**, with exactly `config.ts`, `sources.ts`, and `static.ts` per provider. See [the import inventory](docs/adapter-import.md) for what was retained and which legacy assumptions require review. Imported adapters are not claims that their sources or financial values have been verified.

## Develop in the cloud

Use Node 24 and pnpm 11.25.0. Use the existing checkout; a cloud task is already isolated.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

Supply PostgreSQL credentials and admin authorization in `.env`. Use URL-encoded database passwords. Commands below load this ignored file through Node's supported environment-file option:

```sh
# Or use your platform's injected environment bindings instead.
export NODE_OPTIONS="--env-file=$(pwd)/.env"
pnpm db:migrate
pnpm cards validate
pnpm dev
# A separate cloud terminal/process:
pnpm worker
```

For a cloud-only development database, `pnpm cloud:dev` creates or starts a persistent loopback-only PostgreSQL container, applies migrations, and saves generated local credentials in ignored `.local/dev.env`. Re-running it preserves the database and credentials. Start commands can use `node --env-file=.local/dev.env --run dev` and `node --env-file=.local/dev.env --run worker`.

For a containerized database and application, `docker compose up --build -d` starts three services. The worker runs migrations before accepting jobs; admin waits for worker readiness. Only route admin's internal port 3000 in Coolify. Compose deliberately publishes no host ports. See [deployment](docs/deployment.md) for local port forwarding, production auth, backups, and smoke checks.

Cloud network access must permit configured adapter domains and `openrouter.ai`; see `sources.ts` and the saved environment network draft. A warm source/extraction cache needs no model key. Changed-source extraction requires an OpenRouter binding. Live provider pages, robots policies, redirects, and site-specific rendering limitations must be checked before publishing real facts.

## CLI

Run from the repository root (inside worker: `/app`). CLI administration trusts access to the worker/container and database; the web UI independently verifies every admin request and action.

```sh
pnpm cards validate
pnpm cards sync etherfi
pnpm cards sync --all
pnpm cards sync etherfi --force
pnpm cards status
pnpm cards review
pnpm cards review etherfi
pnpm cards approve <review-id> --reviewer 'name@example.com'
pnpm cards reject <review-id> --reviewer 'name@example.com'
pnpm cards cache
```

`sync` creates and executes a tracked job. The UI enqueues the same kind of job for the worker. Failed or budget-exhausted subsets result in a failed job and nonzero CLI exit status. Force creates a new candidate; it does not bypass review.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
POSTGRES_PASSWORD=temporary DATABASE_URL=postgresql://cards:temporary@postgres/cards docker compose config --quiet
```

GitHub Actions runs these checks against disposable PostgreSQL and builds both Docker targets. No model key is needed for CI.

Unit tests exercise canonical schema, normalization, evidence, shared budget, scoped sorting, adapter discovery, and deterministic merge. Integration tests **truncate their dedicated database**:

```sh
# Never point TEST_DATABASE_URL at production or a shared database.
TEST_DATABASE_URL=postgresql://postgres:temporary@127.0.0.1:55432/cards_test pnpm test:integration
```

Without `TEST_DATABASE_URL`, the integration suite is explicitly skipped. The six scenarios in `tests/fixtures/scenarios.json` are synthetic regression examples, not real-provider extraction accuracy measurements. See [evaluation](docs/evaluation.md).

## Data and UI

The admin has Overview, Cards (including details), Runs, and Reviews. Standard HTTP Basic auth (a strong environment-provided password over HTTPS) or verified Cloudflare Access JWTs protect admin reads and writes. There is no custom account/session system. The default is fail-closed Cloudflare Access mode.

Public read-only endpoints:

- `GET /api/cache/cards`: product/tier directory with typed facts and separate provider/product defaults.
- `GET /api/cache/cards/:id`: complete accepted provider data, scoped rules, and provenance.
- `GET /api/health`: database/migration readiness.

Cache responses have canonical key ordering, content ETags and CDN cache headers. Unknown lists are `null` or omitted; confirmed empty lists remain `[]`. No FX conversion or cross-currency money comparison occurs.

Read [architecture](docs/architecture.md), [adapters](docs/adapters.md), [schema](docs/schema.md), [deployment](docs/deployment.md), and [the original Phase 1 plan](docs/implementation-plan.md).

Licensed under MIT; see [LICENSE](LICENSE).
