import { db, transaction, type CardRow, type Connection } from "@cards/db";
import {
  Card,
  type CardData,
  type FeaturesData,
  type FeeData,
  type ScopeData,
} from "./schema";
import { canonical, hash } from "./serialize";
import { overlay } from "./merge";
import { REGIONS } from "./regions";
import { loadAdapters } from "./adapters";
export interface DirectoryRow {
  id: string;
  providerId: string;
  provider: string;
  productId: string | null;
  product: string | null;
  tierId: string | null;
  tier: string | null;
  legacyRegion: string | null;
  facts: FeaturesData;
  providerDefaults: FeaturesData;
  productDefaults: FeaturesData;
  fees: FeeData[];
}
const features = (value: unknown): FeaturesData => {
  const x = Card.partial().passthrough().parse(value);
  const {
    id: _id,
    name: _name,
    website: _site,
    products: _products,
    fieldSources: _sources,
    unconfirmedFields: _unconfirmed,
    ...rest
  } = x;
  delete rest.tiers;
  delete rest.legacyRegion;
  delete rest.lifecycle;
  delete rest.retiredAt;
  delete rest.inheritFields;
  delete rest.defillamaSlug;
  return rest as FeaturesData;
};
export function directory(cards: CardData[]): DirectoryRow[] {
  const result: DirectoryRow[] = [];
  for (const card of [...cards].sort((a, b) => a.id.localeCompare(b.id))) {
    const base = features(card);
    const products = card.products?.length ? card.products : [null];
    for (const p of products) {
      const tiers = p?.tiers?.length ? p.tiers : [null];
      for (const t of tiers) {
        const inherited = (
          value: { inheritFields?: string[] } & FeaturesData,
        ) =>
          Object.fromEntries(
            (value.inheritFields || []).map((k) => [
              k,
              (value as Record<string, unknown>)[k],
            ]),
          );
        const facts = (
          t
            ? overlay(
                overlay(inherited(card), p ? inherited(p) : {}),
                features(t),
              )
            : p
              ? overlay(inherited(card), features(p))
              : features(card)
        ) as FeaturesData;
        result.push({
          id: [card.id, p?.id, t?.id].filter(Boolean).join("/"),
          providerId: card.id,
          provider: card.name,
          productId: p?.id || null,
          product: p?.name || null,
          tierId: t?.id || null,
          tier: t?.name || null,
          legacyRegion: t?.legacyRegion || null,
          facts,
          providerDefaults: base,
          productDefaults: p ? features(p) : {},
          fees: facts.fees || [],
        });
      }
    }
  }
  return result;
}
export interface Filter {
  search?: string;
  country?: string;
  region?: string;
  network?: string;
  issuer?: string;
  tier?: string;
  cardType?: "physical" | "virtual";
  iban?: boolean;
  kyc?: boolean;
  currency?: string;
  reward?: boolean;
  feature?: string;
}
export function filterDirectory(rows: DirectoryRow[], f: Filter) {
  return rows.filter((row) => {
    const x = row.facts;
    if (
      f.search &&
      ![row.provider, row.product, row.tier]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(f.search.toLowerCase())
    )
      return false;
    if (
      f.country &&
      (x.excludedResidentCountries?.includes(f.country) ||
        !(
          x.residentCountries?.includes(f.country) ||
          x.regions?.some((r) => REGIONS[r]?.includes(f.country!))
        ))
    )
      return false;
    return (
      (!f.region || !!x.regions?.includes(f.region)) &&
      (!f.network || x.network === f.network) &&
      (!f.issuer ||
        x.issuer?.name.toLowerCase().includes(f.issuer.toLowerCase())) &&
      (!f.tier || row.tierId === f.tier) &&
      (!f.cardType || x.cardTypes?.[f.cardType] === true) &&
      (f.iban === undefined || x.iban?.supported === f.iban) &&
      (f.kyc === undefined || x.kyc === f.kyc) &&
      (!f.currency || !!x.currencies?.includes(f.currency)) &&
      (f.reward === undefined ||
        x.rewards?.some((r) => (r.ratePercent || 0) > 0) === f.reward) &&
      (!f.feature || !!x.features?.includes(f.feature))
    );
  });
}
export function applicable(
  scope: ScopeData,
  context: { country?: string; currency?: string; tierId?: string; cardType?: "physical" | "virtual"; cardOrder?: "first" | "additional"; paymentRail?: string; dayOfWeek?: NonNullable<ScopeData["daysOfWeek"]>[number] },
) {
  // Free-text conditions cannot be established by the directory's sort context.
  if (scope.conditions?.length) return false;
  if (scope.daysOfWeek && (!context.dayOfWeek || !scope.daysOfWeek.includes(context.dayOfWeek))) return false;
  if (scope.cardTypes && (!context.cardType || !scope.cardTypes.includes(context.cardType))) return false;
  if (scope.cardOrder && scope.cardOrder !== context.cardOrder) return false;
  if (scope.paymentRails && (!context.paymentRail || !scope.paymentRails.includes(context.paymentRail))) return false;
  if (scope.excludedTransactionCurrencies && (!context.currency || scope.excludedTransactionCurrencies.includes(context.currency))) return false;
  if (scope.residentCountries === null) return false;
  if (
    scope.residentCountries &&
    (!context.country || !scope.residentCountries.includes(context.country))
  )
    return false;
  if (
    scope.excludedResidentCountries &&
    (!context.country ||
      scope.excludedResidentCountries.includes(context.country))
  )
    return false;
  if (
    scope.regions &&
    (!context.country ||
      !scope.regions.some((r) => REGIONS[r]?.includes(context.country!)))
  )
    return false;
  if (
    scope.transactionCurrencies &&
    (!context.currency ||
      !scope.transactionCurrencies.includes(context.currency))
  )
    return false;
  if (
    scope.tierIds &&
    (!context.tierId || !scope.tierIds.includes(context.tierId))
  )
    return false;
  // Sorting cannot assume transaction country, funding currency or merchant category.
  if (
    scope.transactionCountries !== undefined ||
    scope.fundingCurrencies !== undefined ||
    scope.merchantCategories !== undefined
  )
    return false;
  return true;
}
export function sortFees(
  rows: DirectoryRow[],
  kind: FeeData["kind"],
  context: { country: string; currency: string; cardType?: "physical" | "virtual"; cardOrder?: "first" | "additional"; paymentRail?: string; dayOfWeek?: NonNullable<ScopeData["daysOfWeek"]>[number] },
  calculation: "percentage" | "fixed" = "percentage",
) {
  const val = (r: DirectoryRow) => {
    const rules = r.fees.filter(
      (x) =>
        x.kind !== "other" &&
        x.kind === kind &&
        x.status !== "unconfirmed" &&
        applicable(x.scope, { ...context, tierId: r.tierId || undefined }),
    );
    if (rules.length !== 1) return null;
    const rule = rules[0];
    if (calculation === "percentage" && rule.calculation === "percentage")
      return rule.ratePercent;
    if (
      calculation === "fixed" &&
      rule.calculation === "fixed" &&
      rule.fixed.currency === context.currency
    )
      return rule.fixed.amount;
    return null;
  };
  const decimalCompare = (a: string, b: string) => {
    const [ai, af = ""] = a.split("."),
      [bi, bf = ""] = b.split(".");
    return (
      ai.length - bi.length ||
      ai.localeCompare(bi) ||
      af
        .padEnd(Math.max(af.length, bf.length), "0")
        .localeCompare(bf.padEnd(Math.max(af.length, bf.length), "0"))
    );
  };
  return [...rows].sort((a, b) => {
    const av = val(a),
      bv = val(b);
    return av === null
      ? bv === null
        ? a.id.localeCompare(b.id)
        : 1
      : bv === null
        ? -1
        : typeof av === "number" && typeof bv === "number"
          ? av - bv || a.id.localeCompare(b.id)
          : decimalCompare(String(av), String(bv)) || a.id.localeCompare(b.id);
  });
}
async function put(
  c: Connection,
  key: string,
  value: unknown,
  version: number | null = null,
) {
  const payload = canonical(value);
  await c.query(
    "INSERT INTO cache_entries(key,payload,content_hash,card_version) VALUES($1,$2,$3,$4) ON CONFLICT(key) DO UPDATE SET payload=EXCLUDED.payload,content_hash=EXCLUDED.content_hash,card_version=EXCLUDED.card_version,updated_at=now()",
    [key, payload, hash(payload), version],
  );
}
export async function rebuildCache() {
  const adapters = await loadAdapters(undefined, { includeRetired: true });
  const configuredIds = adapters.map(a => a.config.id);
  const retiredIds = adapters.filter(a => a.config.retired).map(a => a.config.id);
  // One transaction and a global lock prevent an older rebuild overwriting newer publication.
  await transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended('cache',0))");
    // Retirement is operational metadata, separate from accepted facts/history.
    await c.query("UPDATE cards SET retired=(id=ANY($1::text[])) WHERE id=ANY($2::text[]) AND retired IS DISTINCT FROM (id=ANY($1::text[]))", [retiredIds, configuredIds]);
    await c.query("DELETE FROM cache_entries e WHERE e.key LIKE 'cards/%' AND NOT EXISTS (SELECT 1 FROM cards c WHERE NOT c.retired AND e.key='cards/'||c.id)");
    const { rows } = await c.query<CardRow>("SELECT * FROM cards WHERE NOT retired ORDER BY id");
    for (const row of rows)
      await put(c, `cards/${row.id}`, Card.parse(row.data), row.version);
    await put(c, "cards", directory(rows.map((x) => Card.parse(x.data))));
  });
}
export async function readCache(key: string) {
  return (
    await db().query<{ payload: string; content_hash: string }>(
      "SELECT payload,content_hash FROM cache_entries WHERE key=$1",
      [key],
    )
  ).rows[0];
}
export async function cacheMismatch() {
  return (
    await db().query<{ count: string }>(
      "SELECT count(*) FROM cards c LEFT JOIN cache_entries e ON e.key='cards/'||c.id WHERE NOT c.retired AND e.card_version IS DISTINCT FROM c.version",
    )
  ).rows[0].count;
}
