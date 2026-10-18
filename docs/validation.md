# Cloud validation and remaining work

The implementation is on `codex/phase-1-crypto-cards`. `main` is the empty initialization commit used as a review base. The implementation has not been merged or deployed to Coolify.

## Latest live test

The full automated suite now has 50 passing tests, including PostgreSQL integration, signed JWT verification and termination of a deliberately CPU-stuck PDF worker. TypeScript, lint, the production build, real HTTP checks, browser review approval, five mobile screens, a separate queue worker and a local database backup/restore pass.

Live OpenRouter testing found and fixed unsupported URI schema annotations, context-insensitive null decoding, missing country-code hints and unbounded PDF parsing. Cold and warm benchmark passes now share one $5 budget. The supplied credential was used only in temporary process environments and was not written to repository files or environment settings.

**Live ingestion has not met acceptance.** The cloud DNS resolver prevents the native crawler from completing its public-address checks for every provider. An independent HTTPS proxy audit fetched 402 of 446 configured URLs; missing/restricted pages, PDF timeouts and a JavaScript page leave 399 usable snapshots. Real model extraction from those snapshots still fails on incomplete output, schema violations and invalid evidence. A successful sync is also not proof of semantic accuracy: a Ready spot check found unsupported physical/virtual flags inferred from ordering unavailability. The latest six-case live regression missed an explicit issuer fact. See [the detailed live report](live-validation.md) for provider results and measured costs. No production model or 50-provider budget claim is approved.

## Verified

- All 36 imported providers validate, with 446 configured URLs and exactly three declarative TypeScript files each. No legacy extraction functions or workflow instructions were imported.
- Dependency installation succeeds with the frozen lockfile and package/TLS verification intact.
- TypeScript and ESLint checks pass.
- All 50 tests pass, including nine real PostgreSQL integration tests. These cover unchanged-source zero-agent-call reuse, stable publication/cache bytes, financial review, rejection, stale approval, failed/invalid/incomplete/budget-exhausted extraction, static changes without a model request, missing-fact preservation, SQL job claiming, and CLI approval without an additional required flag.
- Additional regression coverage includes static provenance replacement, switching fee calculation variants without retaining incompatible fields, scoped regional sorting, unknown/zero/false/empty distinctions, real PDF text extraction, textless PDF classification, preservation of article-header dates and footer caveats, trusted destinations, and forged admin-header rejection.
- The Next.js production build passes.
- Real HTTP checks pass for health, all four authenticated admin screens, anonymous admin rejection (401), public cache write rejection (405), public JSON, detail JSON, and ETag/304 behavior.
- A browser test displayed the proposed source quote, approved a change from 1.5% to 2%, and verified the public cache changed only after approval. A 390px mobile viewport had no horizontal overflow.
- A separately running worker completed a cache job inserted by another process.
- A real PostgreSQL custom-format dump restored into a separate database; card/version counts and publication hashes matched. This was a local restore test, not an off-host backup configuration.
- The repeatable cloud database helper preserves its existing development credentials and named volume on a second invocation. Development credentials, screenshots, dependencies, and generated files are ignored by Git.
- Compose configuration and backup/restore shell syntax validate.

Both Docker targets build. The admin image starts as the non-root runtime user and passes the same authenticated HTTP/API checks. The worker image starts as the non-root runtime user, applies migrations, and polls jobs. Its CLI validates all adapters and completes a cache job, and Chromium executes a JavaScript-rendered fixture successfully. The Dockerfile consolidates stages and keeps browser installation independent of app source changes.

Those individual image checks predate the latest extraction/PDF fixes. The latest source passes the host build and automated checks. Fresh image validation runs in GitHub CI; current results appear in the pull request checks. The complete Compose stack has not been rerun because of this machine's previously demonstrated storage limit.

The complete three-service Compose deployment could not be validated simultaneously on this cloud machine: the 32 GB Docker VFS filesystem ran out of space. Individual service checks and the real shared PostgreSQL workflows above passed. Validate the complete Compose stack on a Docker host with sufficient storage before production.

## External validation still required

The initial six regression scenarios are synthetic. They have now been tested with live OpenRouter requests, and real-provider snapshots have been exercised against a dedicated database. Those results reveal quality failures; a real-provider golden corpus, complete native cold/warm benchmark and production model selection remain pending. Supply production credentials securely and run the native benchmark on a machine with functioning DNS and permitted source access. Do not infer that 50 providers fit $5 from failed or incomplete extractions.

Cloudflare Access is implemented with signature/issuer/audience/expiry/email verification, but a real Access deployment and positive JWT smoke test require the operator's team and audience configuration. The running UI checks used standard development Basic auth.

Git read and branch pushes work. GitHub API access now works with the existing authentication. GitHub Actions results and deployment checks are separate from the local test results recorded here.

Coolify connection, HTTPS domain routing, production credentials, Git-backed redeployment/persistence, off-host backup scheduling/retention, and a production backup restore remain operator tasks. Follow deployment.md; a local image build does not establish production deployment.

The cloud machine uses Docker's VFS storage driver on a 32 GB filesystem. Earlier simultaneous image/Compose attempts exhausted disk space. Only task-created images/build caches were removed; database volumes and source files were preserved. The Dockerfile shares a common base, caches dependency downloads, and keeps browser installation independent of application source changes. The complete stack did not fit here; run the provided CI or validate the Compose application on a Docker host with adequate disk and overlay storage.

Environment draft fields saved: install_script, start_skill, source/OpenRouter/GitHub API allowed domains, and the OPENROUTER_API_KEY requirement. The repository checkout is pinned to the pushed implementation commit for future tasks. Saving these fields does not apply them to this machine or publish an environment version. Review and save the draft in environment settings, supply the key securely, then publish the environment when ready.
