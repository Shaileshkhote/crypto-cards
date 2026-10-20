











DeFiLlama Crypto Cards — Phase 1 Implementation Plan
Goal: Build and deploy a simple, clean, open-source agentic crypto-card extraction system in one TypeScript monorepo, operated through a CLI and a small admin UI, with PostgreSQL as the source of truth and a generated frontend cache.

Scope: Phase 1 is extraction, review, publishing, storage, and UI-ready data. Do not build the monthly-spend simulator in Phase 1. Its future needs inform the schema only.

Constraints: 50+ providers; exactly three .ts files per provider; one universal OpenRouter agent; discovery: false by default; unchanged inputs produce byte-identical published data; no silent loss of accepted values; shared $5 maximum OpenRouter budget per sync --all invocation; fast incremental runs; one pnpm monorepo deployed as one Git-backed Docker Compose application on Coolify; straightforward code and documentation.

1. Non-negotiable design decisions
One monorepo: UI, worker/CLI, adapters, shared extraction logic, schemas, database migrations, tests, and Docker Compose are in one Git repository.
One core: CLI, worker, and UI call shared functions; the UI does not reimplement sync, review, merge, or publication logic.
One agent: OpenRouter tool-calling agent with listPages, searchDocs, and readPage. No multi-agent system, LangGraph workflow, embeddings, or per-provider extraction functions.
Three adapter files: config.ts, sources.ts, static.ts. Files are declarative data, not executable provider-specific scraping logic.
Adapter-owned discovery: discovery: false unless enabled explicitly in config.ts. With discovery disabled, no extra URLs outside sources.ts; with it enabled, exploration stays within allowed domains.
Static plus extracted: Explicit static information (issuer, IBAN, physical/virtual, team-reported facts, fees, etc.) takes precedence over extracted information. Omitted static fields do not override values; zero/false/empty arrays are meaningful.
Numeric, scoped schema: Represent fees, limits, cashback, tiers, availability, country/region, currencies, caps, and conditions as typed data, not prose. Unrepresentable rules keep description and calculable: false.
No silent overwrites: LLM responses are candidates. Existing financial/eligibility value changes require review; failed/incomplete extraction never destructively replaces published data.
Reproducible publication: The same accepted extraction snapshot + static input + merge/schema version yields byte-identical canonical JSON. LLM execution itself is not guaranteed deterministic.
Budget boundary: $5 is the combined budget across all adapters in one run—not $5 each. Stop sending new LLM requests when insufficient budget remains. A cold full run must be benchmarked rather than promised to fit.
No speculative safeguards: Only clear validation, trusted-domain restrictions, budget/step limits, provenance checks, safe publication, auth, and database backups. No expanding list of special-case fallbacks.
Phase 2 boundary: No calculator, ranking by estimated spend, FX-rate service, or simulator UI/API in Phase 1.
2. Monorepo layout
crypto-cards/
  apps/
    admin/                      # Next.js admin UI and read-only cache API
    worker/                     # Long-running job runner and CLI entrypoint
  packages/
    core/src/
      crawler.ts                # HTTP/browser/PDF extraction and normalization
      agent.ts                  # One OpenRouter agent, three tools
      schema.ts                 # Zod schemas + shared TS types
      merge.ts                  # Pure deterministic merge + diff
      sync.ts                   # Fetch, cache, extract, candidate, publish
      review.ts                 # Approve/reject through shared code
      cache.ts                  # Build UI projections from published PG data
    db/
      migrations/
      src/index.ts              # Thin SQL/DB access layer
    adapters/
      etherfi/{config,sources,static}.ts
      avici/{config,sources,static}.ts
      mexc/{config,sources,static}.ts
  tests/
    fixtures/                   # 5-8 hand-verified representative providers
    sync.test.ts
    merge.test.ts
    schema.test.ts
    cache.test.ts
  docs/
    architecture.md
    adapters.md
    schema.md
    deployment.md
  Dockerfile
  docker-compose.yml
  pnpm-workspace.yaml
  package.json
  .env.example
  README.md
Keep source files small. Add modules only when an existing file becomes genuinely hard to understand. Discover adapters automatically at build/startup without editing a registry.

3. Adapter contract
config.ts — identity and optional hints

import type { CardConfig } from "@cards/core/schema";

export default {
  id: "example-card",
  name: "Example Card",
  website: "https://example.com",
  discovery: false,
  products: [],             // known identities optional
  tiers: [],                // known identities optional
  aliases: {}               // e.g. old-premium -> premium
} satisfies CardConfig;
sources.ts — explicit trusted URLs

import type { CardSources } from "@cards/core/schema";

export default {
  urls: [
    "https://example.com/docs/cards",
    "https://example.com/help/fees",
    "https://example.com/legal/terms.pdf"
  ],
  allowedDomains: ["example.com"]
} satisfies CardSources;
static.ts — manually maintained data; illustrative, not real provider facts

import type { CardStaticData } from "@cards/core/schema";

export default {
  network: "visa",
  issuer: { name: "Example Issuer", country: "GB" },
  cardTypes: { physical: true, virtual: true },
  iban: { supported: true, type: "personal" },
  tiers: [
    { id: "standard", physical: false, virtual: true },
    { id: "premium", physical: true, virtual: true }
  ]
} satisfies CardStaticData;
Static data may specify any common canonical field, including fees/rewards or regional restrictions supplied by a team. An optional note/source date can be attached when useful; do not require complicated audit objects for each static primitive. At adapter load, validate all three files via Zod and fail with a clear filename + field message. Don't silently skip broken adapters.

Discovery: false permits only listed URLs, although facts/products/tiers can be discovered inside them. true permits the agent to suggest extra URLs under allowedDomains; save the candidate discovered URL list with the run snapshot. Do not silently remove previously accepted sources. The effective URL inventory participates in the input fingerprint. External domain redirects and private/internal network addresses must be rejected.

Identity: Declared product/tier IDs are canonical. Otherwise reuse previously accepted IDs by matching known names/aliases; auto-assign deterministic IDs for unambiguous new entities. Ambiguous rename/new-tier matches require review, never silently duplicate. Rule identity derives from provider/product/tier/rule kind/applicability, not its value or array index.

4. One universal extraction pipeline
load & validate adapter
  -> fetch configured documents (+ discovery only if enabled)
  -> normalize into documents/blocks with stable hashes
  -> reuse cached extraction for unchanged documents
  -> run one bounded agent on new/changed information
  -> validate output and evidence
  -> merge candidate with accepted data and static.ts
  -> compute human-readable diff
  -> auto-accept safe new facts; queue sensitive changes for review
  -> commit per-card publication transaction
  -> regenerate affected cache data from PostgreSQL
4.1 Crawler
Plain HTTP first; browser rendering only for JavaScript sites that need it.
Parse HTML, markdown/help pages, PDF text, and tables. Preserve table headings/rows and caveats near the data.
Normalize whitespace, URLs, headings, and repeated navigation; do not strip meaningful effective dates or terms.
Store source URL, title, normalized content, content hash, fetched status, and fetch timestamp in PostgreSQL.
Use concurrent HTTP requests within per-domain bounds. Respect robots/rate limits and apply timeouts. Handle 404/unreachable separately from a verified content change.
Mark unreadable image-only PDFs as pending_transcription/unknown. Add a generic vision fallback only if the evaluation corpus demonstrates the need, and count it against budget.
Content block hashes support reuse when an unrelated page section changes; start with per-document caching if per-block extraction introduces disproportionate complexity.
4.2 Agent
One OpenRouter model with three tools:

listPages(): PageSummary[];
searchDocs(query: string): SearchMatch[];
readPage(url: string): NormalizedDocument;
The agent searches cached normalized documents, not the public internet directly. Only the crawler fetches network URLs. For discovery: true, discovery tools can request additional allowed URLs through the crawler.

The agent extracts card products, tiers, country availability, physical/virtual and issuer/IBAN details, funding tokens/networks, fee and limit rules, cashback, requirements, exclusions, effective dates, and cited supporting passages. Make relevant fields optional; return unknown instead of filling gaps. Use a shared strict JSON Schema on a compatible OpenRouter endpoint, then Zod. Keep max agent steps, input/output token limits, and request cost predictable. Avoid a model fallback chain by default.

4.3 Evidence
Financial/eligibility extracted changes must contain:

type Evidence = {
  url: string;
  blockId: string;
  quote: string;
};
Verify that the blockId belongs to that URL and quote is a substring of the stored normalized block. If a proposed claim fails verification, exclude it from auto-publication and show the extraction issue. Presence of a quote is not proof that its interpretation is correct: changed rates/limits/countries still require review. Static/team-provided values identify their origin as static, without fake quotes.

5. Phase 1 canonical schema
Hierarchy: Provider -> Product -> Tier -> applicable feature/fee/reward/limit rules. Provider/product defaults can be inherited only where the source or static adapter explicitly supports that applicability. Scope is part of every rule identity.

type Money = { amount: string; currency: string }; // decimal string, ISO code

type Applicability = {
  residentCountries?: string[] | null;
  excludedResidentCountries?: string[];
  regions?: string[];                 // centrally defined memberships
  transactionCountries?: string[];
  transactionCurrencies?: string[];
  fundingCurrencies?: string[];
  merchantCategories?: string[];
  tierIds?: string[];
};

type FeeRule = {
  id: string;
  kind:
    | "fx" | "conversion" | "atm" | "monthly" | "annual"
    | "issuance" | "transaction" | "topup" | "replacement" | "inactivity";
  calculation: "fixed" | "percentage" | "tiered" | "unknown";
  fixed?: Money;
  ratePercent?: number;
  minFee?: Money;
  maxFee?: Money;
  allowance?: { amount: Money; period: "day" | "week" | "month" | "year" };
  brackets?: Array<{
    upperBound: Money | null;
    ratePercent: number;
  }>;
  scope: Applicability;
  description?: string;
  calculable: boolean;
  source?: Evidence | { origin: "static"; note?: string };
  status?: "verified" | "unconfirmed";
};

type RewardRule = {
  id: string;
  ratePercent?: number;
  rewardAsset?: string;                // normalized currency/token identifier
  cap?: { amount: Money; period: "month" | "year" };
  requirements?: string[];
  scope: Applicability;
  description?: string;
  calculable: boolean;
  source?: Evidence | { origin: "static"; note?: string };
  status?: "verified" | "unconfirmed";
};
These are illustrative types. Implement final Zod discriminated unions so a fixed fee requires fixed, a percentage requires ratePercent, and tiered fees have defined bracket thresholds, inclusion, marginal-vs-whole-amount behavior, and periods. Do not add new fee types speculatively; support real cases from the first evaluation fixtures. Keep stable field naming like ratePercent (1.5 = 1.5%, not 0.015). Use decimal-safe strings for money in JSON and numeric parsing/decimal math later in Phase 2.

Other canonical fields (all typed/nullable when unknown): provider/product/tier ID and display name, issuer name/ID/country, Visa/Mastercard/other network, physical/virtual, IBAN support/type, KYC, custodial status, supported/excluded residence countries, regions, supported currencies, crypto assets, chains, fees, rewards, spending/ATM limits, effective dates, and terms. Store ISO 3166-1 alpha-2 country codes; use centrally maintained definitions for EU/EEA and other well-defined regions. Never silently equate EU, EEA, Europe, and APAC. Distinguish unknown list (null) from confirmed empty list ([]). Preserve original narrative for rules that cannot be calculated.

Filtering/sorting contract
All meaningful UI fields must be typed, with normalized IDs and numeric rate/money values—not formatted strings. Generate a directory projection one row per provider/product/tier, plus scoped fee rules. Do not collapse multiple regional FX rates into an arbitrary single sortable value. Filter by country, region, tier, issuer, network, card type, IBAN, KYC, currencies, rewards, and features. Sort numeric values only with an explicit applicability context; money in unlike currencies must not be compared without conversion (out of scope for Phase 1). Unknown appears last or separately, never as 0. Tests must cover regional/tier distinctions.

6. Determinism, incremental speed, and no silent data loss
Output determinism is the target, not reproducible LLM thought/tool paths.

Document fingerprint: normalized text/content + URL and meaningful scope. Stable normalization removes irrelevant boilerplate while retaining fee-related dates.
Extraction fingerprint: document snapshot/hash + agent prompt version + schema version + model/provider configuration + extraction parameters. Reuse the previously accepted cached extraction for a hit; no OpenRouter call.
Publication fingerprint: accepted extraction records + static adapter data + merge version. Rebuild via pure merge with deterministic ordering and stable JSON serialization.
Per-document reuse: On changed docs, keep unchanged source extractions. Re-evaluate affected scope when cross-document context demands it; no blanket re-extraction of all pages.
Separate static path: If only static adapter data changes, rebuild candidates without OpenRouter. A normal scheduled sync still checks whether remote sources changed.
No destructive replacement: Never UPDATE cards SET data = freshLLMOutput directly. Merge candidates with existing accepted data, preserving unrelated rules and stable IDs.
Update policy

Input/result	Behavior
No source or config change	Return byte-identical published JSON; zero OpenRouter calls
New evidence-backed fact	Auto-accept if schema/evidence valid and no conflict
Existing fee/cashback/limit changes	Hold a proposed diff for review; retain old published value
Supported/excluded country list changes	Hold diff for review
Product/tier identity ambiguous or replaced	Hold for review
Existing value not found in changed source	Mark as unconfirmed with lastSeenAt; retain value for review, do not silently delete
Source fetch fails or 404s	Keep last known; mark stale/unavailable, never infer a zero/removal
Static contradicts extracted	Static wins, record the discrepancy for review context (simple log)
Invalid schema, evidence, or budget exceeded	Do not publish candidate; preserve published version
Explicitly approved removal	Remove from current published data, retain in version history
Preserve old published facts even when a candidate is pending. No new candidate can accidentally clear a different tier or region. An approved change is applied only if the base published version still matches; otherwise review must be refreshed. Published updatedAt/run timestamps are metadata, excluded from canonical hash and cache JSON. Keep old versions for rollback and configure real database backups; version tables alone are not backups.

7. PostgreSQL data model
Keep tables minimal and JSONB for canonical structures. Proposed seven tables, each tied to a concrete requirement:

Table	Purpose
cards	Current published data JSONB, version, publication hash, updated time
card_sources	Card+URL, normalized snapshot, content hash, fetch state, last successful fetch
card_extractions	Reusable candidate extraction per source/fingerprint, evidence, model, tokens, USD cost
card_versions	Immutable previously published full card JSON by (card_id, version)
card_reviews	Pending/approved/rejected candidate changes, base version, affected paths, evidence, reviewer and time
jobs	Queued/running/completed/failed sync/cache jobs, progress, cost, error
cache_entries	Generated cards/index and cards/:id JSON payloads + content hash; served publicly
Use simple SQL migrations and a thin query layer. card_extractions and card_sources are cached snapshots, not normalized claims/history engines. Group all proposed changes from one adapter run into one review record where that simplifies UI. A card publication and card_versions insertion happen in one PostgreSQL transaction. Cache entries update from committed cards; cache failures never roll back good DB data and can be rebuilt. Use indexes on IDs, review/job status, and extraction fingerprints. Avoid per-fee relational tables initially.

8. Review gate and human-friendly admin UI
New grounded facts can auto-publish when no conflict exists. Changed existing financial or eligibility facts need explicit approval. The old value remains live until approval. Static changes to previously published financial/eligibility facts also go through review unless explicitly authorized as a direct publish.

approveReview(reviewId) and rejectReview(reviewId) live in shared core/review.ts. CLI and Next.js server actions call them—never duplicate logic. Approval transaction verifies card version; applies only the reviewed change(s); stores new card version; marks review resolved. Cache rebuild follows commit. Rejections keep the current card untouched. No raw SQL from UI.

UI screens (four only):

Overview: provider count, last sync status, pending reviews, failures, total/last-run OpenRouter cost.
Cards: searchable provider/product/tier list; filter country/region/network/issuer/virtual/physical/IBAN; detail page with static vs extracted fields, sources, status.
Runs: start single or all syncs; view queued/running/completed/failed, docs changed/reused, token/cost totals and readable errors.
Reviews: human-readable cards showing provider → product → tier → country/region; field name; previous vs proposed value; source quote + clickable URL; approve/reject buttons.
UI style: clean, compact shadcn/ui + Tailwind + Next.js; descriptive labels, consistent units, sensible search/sort, clear empty/error/loading states. Don't start with charts or a large dashboard. Show raw JSON only under an optional details view. All write actions require authenticated admin authorization; protect endpoints server-side (Cloudflare Access may be used, with identity/authorization verification). Public cache endpoints must be separately read-only.

9. CLI contract
pnpm cards validate             # Check all adapters
pnpm cards sync etherfi         # Sync one adapter
pnpm cards sync --all           # Full run under shared $5 budget
pnpm cards sync etherfi --force # Bypass extraction cache; create candidate
pnpm cards status               # Jobs, costs, failures, review counts
pnpm cards review               # List pending human-readable diffs
pnpm cards review etherfi       # Filter reviews
pnpm cards approve <review-id>  # Approve via shared core
pnpm cards reject <review-id>   # Reject via shared core
pnpm cards cache                # Rebuild cache entries from PostgreSQL
CLI must be usable inside the deployed worker container, in cloud coding environments, and from automated jobs. UI triggers the same sync by inserting a jobs row; the worker executes it. Show card ID, documents changed/reused, statuses, number of proposed changes, tokens, cost, and error. No misleading success messages if a subset failed or budget exhausted.

10. Fast runs and OpenRouter cost control
Prefer cheap document retrieval, normalization, and local keyword search before LLM requests.
discovery: false by default; explicit configured sources only.
Reuse document and extraction cache; no LLM on cache hits.
Provide the agent compact search excerpts; allow full page reads on demand.
Use one benchmarked inexpensive model that supports required tool-calling and structured outputs.
Start with one bounded agent per adapter, limited steps and output tokens. Small global LLM concurrency to make cost reservations predictable.
Track actual input/output tokens and returned USD cost (if available). Reserve a conservative maximum estimate before each request to avoid overspending from requests in flight.
Global $5 invocation cap, with optional smaller per-adapter cap; stop starting requests when budget is insufficient. Report not-run adapters; do not publish partial invalid output.
Warm no-change run: target near-zero OpenRouter spend. Cold full run: benchmark 5–8 adapters and estimate total before claiming all 50+ can succeed for $5. If cost cannot fit, report measured gap rather than silently degrading correctness.
Do not assert an absolute provider-billing cap from application estimates alone; use provider-side spend controls when supported.
11. Cache generation and public data
PostgreSQL is canonical. Rebuild cache only from published cards, never pending reviews or agent output. Store generated payloads in cache_entries (avoids shared volumes between UI/worker). Expose read-only JSON endpoints from Next.js, for example:

GET /api/cache/cards
GET /api/cache/cards/:cardId
Use stable key ordering, version/hash-based ETags, and CDN cache headers; refresh cache after committed publications and allow explicit rebuild. Directory cache has one row per product/tier and normalized fields for filtering. Detail cache includes complete scoped rules and source/status. Unknown values remain unknown. A failed extraction/review doesn't alter public cache. If a rebuild fails, retain prior cache and clearly report the mismatch until rebuilt.

12. One Coolify deployment: three services
One Git-backed Docker Compose application in one Coolify project/environment:

admin — Next.js UI, admin actions/API, read-only public cache endpoints; the only publicly routed service.
worker — long-running job poller, sync/extraction engine, CLI entrypoint. No public port.
postgres — PostgreSQL with a persistent named volume. No public port.
Build admin and worker from the same pnpm monorepo Dockerfile with separate targets or commands. Use a single docker-compose.yml stored in Git. Don't run extraction inside long-running Next.js HTTP requests. Worker polls PostgreSQL jobs; one worker initially, one active sync per adapter, and a simple reclaim policy for interrupted jobs. No Redis/BullMQ/RabbitMQ. Optional scheduled sync can enqueue jobs using a lightweight worker timer or Coolify scheduling, not a second extraction pipeline.

Compose shape (implementation sketch; complete build stages during coding):

services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 10

  admin:
    build:
      context: .
      dockerfile: Dockerfile
      target: admin
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    # Route the admin's internal port 3000 to a domain in Coolify.
    # No published host ports necessary.

  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: worker
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      EXTRACTION_MODEL: ${EXTRACTION_MODEL}
      MAX_RUN_COST_USD: ${MAX_RUN_COST_USD:-5}
    depends_on:
      postgres:
        condition: service_healthy
    # No public port.

volumes:
  postgres_data:
All secrets live in Coolify environment variables; never commit real keys or passwords. Limit database access to internal Docker networking. Run migrations with a controlled deployment command before starting worker jobs; do not have multiple services race to migrate. Include health checks for admin/worker and clear startup errors. Configure automated PostgreSQL backups off the host and perform a restore test. Persistent volumes are not backups. When exposing cache endpoints publicly, protect admin mutation routes separately and restrict CORS/origins if relevant.

Coolify procedure: connect the Git repository; create a Git-backed Application; select Docker Compose as build strategy; point to docker-compose.yml; set environment variables; attach a domain to admin:3000; deploy; inspect build/runtime logs and health checks; run migrations; confirm login, job execution, review, cache endpoint, persistence after redeploy, and backups. Keep the Compose file in Git as the source of truth, not a pasted Compose-only service.

13. Cloud coding with ChatGPT — no local laptop required
The deliverable must be implementable entirely from a cloud coding environment connected to a Git repository. Prefer Codex Cloud for repository editing, tests, and PRs; use ChatGPT Work on web/mobile for research, reviewing outputs, and browser-based site configuration when appropriate and authorized. This depends on account/workspace access and connected services; do not claim that this ordinary chat already has repository or Coolify credentials. No desktop terminal is required if the cloud coding environment can build/test and Coolify is reachable in a browser.

Practical handoff sequence:

Create or select one GitHub repository and connect it to the cloud coding environment.
Provide this plan as docs/implementation-plan.md. Add AGENTS.md with principles: one agent, three adapter files, no per-provider logic, no speculative complexity, protect accepted values.
Implement in bounded PRs: workspace/deployment skeleton; schemas/database; crawler/agent; caching/merge/reviews; CLI/UI; Coolify integration/tests/docs. Each PR must run checks and state what was implemented.
Have the cloud coding agent run pnpm install, typecheck, lint, unit tests, migrations in test Postgres, Docker build, and Compose configuration validation in its cloud environment.
Review and merge PRs in the browser/mobile. Use browser-based Coolify setup for secrets, domain, database backup, deployment, and smoke tests; never paste API credentials into repository files or chat messages.
On each accepted push, Coolify rebuilds/redeploys the same monorepo. Verify actual health, costs, review path, and public cache endpoints.
Cloud-coding task prompt:

Implement this Phase 1 plan in a single pnpm TypeScript monorepo. Keep the core small and readable. Use one OpenRouter agent with three tools; exactly three declarative TypeScript files per card; Zod; PostgreSQL; deterministic merge and cached snapshots; human review for existing fee/eligibility changes; one CLI and one Next.js admin UI sharing the same core; a three-service Git-backed Docker Compose deployment for Coolify. Do not build the simulator. Do not add extra frameworks, agents, queues, a vector database, or provider-specific scrapers. Implement in small testable milestones, run checks, and report actual limitations and costs rather than making promises.

14. Implementation milestones and acceptance tests
Phase 0 — Benchmark and ground truth

Choose 5–8 varied real provider sources: multi-tier, PDF-heavy, JS-rendered, regional fees, caps, multiple issuers.
Manually label expected fees, tiers, regions, and evidence. Select one OpenRouter model after measuring accuracy, latency, and tokens/cost.
Milestone 1 — Repo + adapters + schema + DB

pnpm workspaces; three-file adapters; runtime validation; core Zod schema; migrations; PostgreSQL under Docker Compose.
Pass: adapter discovery works without core edits; wrong adapter fails with a readable error; data round-trips through PG.
Milestone 2 — Crawler + one agent

HTML/PDF/JS normalization, stable hashes, stored snapshots; OpenRouter three-tool loop; source-backed partial structured output.
Pass: golden fixture extraction, unknown-vs-zero, scoped tier/country rules, source quotes verified.
Milestone 3 — Incremental sync + deterministic merge

Cache keys include source/model/prompt/schema; reuse unchanged pages; stable IDs; static precedence; version history.
Pass: same inputs yield byte-identical JSON and zero LLM calls; changing one source does not erase unrelated accepted facts; static edit does not require LLM.
Milestone 4 — Review workflow + CLI

Candidate diffs; pending reviews; approve/reject; stale/unconfirmed; budget caps and cost output; CLI commands.
Pass: changed FX fee cannot silently publish; approval updates exactly the reviewed scope; rejection preserves prior data; stale 404 does not delete the card.
Milestone 5 — Admin UI + cache

Four screens; auth; worker jobs; readable evidence diffs; cache entries; directory filtering/sorting projection and read-only API.
Pass: UI and CLI call the same core functions; region/tier sorting uses applicable values; pending changes never appear in public cache.
Milestone 6 — Coolify deployment + docs + smoke tests

Dockerfile, Compose, migrations, env template, health checks, backup/restore, deployment README; deploy via Git-backed Coolify application.
Pass: single Git push redeploys UI/worker, database survives redeploy, worker sync runs, review approves, cache updates, public endpoint serves correct published data, admin endpoints reject unauthenticated writes.
Definition of done
50+ adapter-ready architecture with three .ts files per provider; adding an adapter requires no core edit.
One universal bounded OpenRouter agent with explicit discovery flag.
Data types preserve numeric fees, countries, regions, products, tiers, money currencies, caps, conditions, and unknowns.
Approved snapshots reproducible; no OpenRouter request on unchanged-source cache hits.
Bad/partial/cost-exceeded extractions cannot erase accepted data.
New facts auto-accept only when validated; existing financial/eligibility changes wait for approval.
CLI and clean admin UI share code; job execution works across processes.
PostgreSQL authoritative; public cache generated only from accepted data; stable UI directory projection.
Combined sync --all OpenRouter usage stops within configured budget policy; real cold/warm costs measured and reported.
Entire stack deploys as one Git-backed Coolify Compose application, with secrets, auth, database persistence, and backups.
Tests, README, adapter contributor instructions, schema and deployment docs are complete.
Phase 2 simulator is not implemented.
15. Final decision summary
Build: one pnpm monorepo, three .ts files per card, one agent with three tools, straightforward crawler, source snapshots, stable Zod schema, a pure merge, PostgreSQL, transactional per-card publishing, a compact CLI, four-screen admin UI, one worker, and JSON cache endpoints, deployed together through Coolify.

Do not build: multi-agent workflows, per-provider scrapers, vector DB, generic claims engine, separate cache server, custom auth system, message broker, simulator, or additional abstractions that are not required by tests or real failures.

Success means: a provider's documentation or static facts can change, the system extracts only what it needs, preserves old accepted information, shows understandable diffs for risky changes, stays within the configured LLM budget, and serves clean, sortable, structured card data—without manual laptop development or complicated infrastructure.



⋮⋮⋮⋮