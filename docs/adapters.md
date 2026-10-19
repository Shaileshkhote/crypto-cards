# Adding an adapter

Create a directory under `packages/adapters/<id>` with exactly three TypeScript files. Discovery requires no registry changes. Files export literal data with type-only imports from `@cards/core/schema`; do not add functions, regular-expression scrapers, prompts, or provider-specific exceptions.

`config.ts` declares the provider ID, name, HTTPS website, optional known product/tier identities and aliases. Set `discovery: false` unless intentionally enabling bounded exploration under the source allowlist. Tier identities have `productId`; original region-specific identity labels may be retained in `legacyRegion`, which does not grant country availability.

```ts
import type { CardConfig } from '@cards/core/schema';
export default {
  id: 'example', name: 'Example', website: 'https://example.com',
  discovery: false,
  products: [{ id: 'example-card', name: 'Example Card' }],
  tiers: [{ id: 'example-core', name: 'Core', productId: 'example-card' }],
  aliases: { 'Old Core': 'example-core' },
} satisfies CardConfig;
```

`sources.ts` declares explicit HTTPS URLs and exact trusted hostnames (including distinct www/help/docs hosts). Optional metadata preserves source/product associations and topics. Redirects must remain on allowed public hosts. With discovery disabled, readPage can only read configured URLs. `robots.txt` is an infrastructure request used to respect the site's crawling rules. Browser assets are not evidence documents and are restricted separately.

```ts
import type { CardSources } from '@cards/core/schema';
export default {
  urls: ['https://example.com/fees'],
  allowedDomains: ['example.com'],
} satisfies CardSources;
```

`static.ts` can specify common canonical fields at provider/product/tier scope. Omitted fields do not override extraction. To apply an ancestor default to every child, explicitly list the supported field in `inheritFields`; otherwise it remains local to that scope. Explicit zero, false, null, and empty lists have meaning. New static values identify their origin as static; subsequent edits to existing accepted financial/eligibility fields still require review.

```ts
import type { CardStaticData } from '@cards/core/schema';
export default {
  note: 'Team-maintained facts', sourceDate: '2026-10-18',
  products: [{ id: 'example-card', name: 'Example Card', tiers: [{
    id: 'example-core', name: 'Core', cardTypes: { physical: false, virtual: true },
  }] }],
} satisfies CardStaticData;
```

Run `pnpm cards validate` then add representative regression fixtures. Loader errors include provider, filename and field. Never reinterpret a broad geographic label as an ISO country set; use explicit ISO alpha-2 countries or maintained EU/EEA region codes. An unknown country list is null/omitted, not every country in the world.

The supplied legacy adapter migration preserves catalog data, not the old pipeline's instructions or exceptions. See [adapter-import.md](adapter-import.md). Review its source URLs, lifecycle states and branding origins before a real publication. Conditional scraping rules must be re-extracted with verifiable source quotes.

## Retiring an adapter

Set `retired: true` at the top level of `config.ts`. SafePal, Gnosis Pay and Ready use this flag. It retires the entire adapter independently of individual product/tier lifecycle metadata. The default loader excludes retired adapters; `loadAdapters(undefined, { includeRetired: true })` retains them for validation and maintenance. `pnpm cards validate` reports active and retired counts separately.

Run `pnpm db:migrate` and `pnpm cards cache` with the database binding after applying configuration changes, or redeploy: worker startup applies retirement before reporting readiness. Cache rebuilding updates `cards.retired` and public projections in one transaction. Retired cards are excluded from active SQL counts, published-card reads, pending reviews and cache output; old per-provider cache entries are removed. Canonical facts, versions, source snapshots, extractions and review records are retained. Historical jobs and spending remain in the audit.

Bulk sync, benchmarks and model evaluations exclude retired adapters. Explicit sync requests are rejected, including `--force`; already queued requests are skipped without source/model calls. Review approval and in-flight publication cannot publish a database row marked retired. A new retired adapter never creates a card through ingestion.

Remove the flag or set it to false and rebuild the cache to reactivate an adapter from its retained publication. The retirement flag is excluded from extraction fingerprints, so toggling this flag alone does not invalidate accepted source extraction caches. Product/tier lifecycle metadata remains independently maintained.
