import {
  Card,
  type CardData,
  type Adapter,
  type ExtractionData,
  type Document,
  Features,
} from "./schema";
import { canonical, hash, slug } from "./serialize";
import { verifyEvidence, verifyFinancialEvidence } from "./evidence";
export const MERGE_VERSION = "14";
type ObjectValue = Record<string, unknown>;
const isObject = (v: unknown): v is ObjectValue =>
  !!v && typeof v === "object" && !Array.isArray(v);
const keyed = (v: unknown): v is (ObjectValue & { id: string })[] =>
  Array.isArray(v) && v.every((x) => isObject(x) && typeof x.id === "string");
const featureFields = new Set(Object.keys(Features.shape));
export interface Change {
  path: string[];
  before?: unknown;
  after?: unknown;
  reason: string;
}
export function overlay(base: unknown, patch: unknown): unknown {
  if (keyed(base) && keyed(patch) && patch.length > 0) {
    const values = new Map(base.map((x) => [x.id, x]));
    for (const x of patch)
      values.set(
        x.id,
        overlay(values.get(x.id) || {}, x) as ObjectValue & { id: string },
      );
    return [...values.values()].sort((a, b) => a.id.localeCompare(b.id));
  }
  if (isObject(base) && isObject(patch)) {
    // Switching a union branch replaces its incompatible fields. A limit
    // becoming non-calculable must not keep its old amount or count.
    if (
      patch.origin === "static" ||
      ("url" in patch && "blockId" in patch && "quote" in patch)
    )
      return patch;
    if (
      (base.calculation !== undefined &&
      patch.calculation !== undefined &&
      base.calculation !== patch.calculation) ||
      (typeof base.calculable === "boolean" &&
        typeof patch.calculable === "boolean" &&
        base.calculable !== patch.calculable)
    )
      return patch;
    const out = { ...base };
    for (const [k, v] of Object.entries(patch))
      if (v !== undefined) out[k] = overlay(base[k], v);
    return out;
  }
  return patch;
}
export function ordered(v: unknown): unknown {
  if (Array.isArray(v)) {
    const a = v.map(ordered);
    return keyed(a)
      ? a.sort((x, y) => x.id.localeCompare(y.id))
      : a.every((x) => typeof x === "string")
        ? [...new Set(a as string[])].sort()
        : a;
  }
  return isObject(v)
    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ordered(x)]))
    : v;
}
function diff(before: unknown, after: unknown, path: string[] = []): Change[] {
  if (canonical(before) === canonical(after)) return [];
  if (keyed(before) && keyed(after)) {
    return [
      ...after.flatMap((x) =>
        diff(
          before.find((y) => y.id === x.id),
          x,
          [...path, x.id],
        ),
      ),
      ...before
        .filter((x) => !after.some((y) => x.id === y.id))
        .map((x) => ({
          path: [...path, x.id],
          before: x,
          reason: "Explicit removal requested",
        })),
    ];
  }
  if (isObject(before) && isObject(after))
    return [
      ...Object.entries(after).flatMap(([k, v]) =>
        diff(before[k], v, [...path, k]),
      ),
      ...Object.keys(before)
        .filter((k) => !(k in after))
        .map((k) => ({
          path: [...path, k],
          before: before[k],
          reason: "Explicit variant replacement removed an incompatible field",
        })),
    ];
  return [
    {
      path,
      before,
      after,
      reason:
        before === undefined
          ? "New grounded fact"
          : "Existing accepted value changed",
    },
  ];
}
export function applyChanges(card: unknown, changes: Change[]): CardData {
  let out = structuredClone(card) as ObjectValue;
  for (const change of changes) {
    let parent: unknown = out;
    for (const [index, key] of change.path.entries()) {
      const last = index === change.path.length - 1;
      if (Array.isArray(parent)) {
        const found = parent.findIndex((x) => isObject(x) && x.id === key);
        if (last) {
          if (change.after === undefined) {
            if (found >= 0) parent.splice(found, 1);
          } else if (found >= 0) parent[found] = change.after;
          else parent.push(change.after);
        } else {
          if (found < 0)
            throw new Error(
              `Missing reviewed entity: ${change.path.slice(0, index + 1).join("/")}`,
            );
          parent = parent[found];
        }
      } else if (isObject(parent)) {
        if (last) {
          if (change.after === undefined) delete parent[key];
          else parent[key] = change.after;
        } else {
          if (parent[key] === undefined)
            parent[key] = [
              "products",
              "tiers",
              "fees",
              "rewards",
              "limits",
            ].includes(key)
              ? []
              : {};
          parent = parent[key];
        }
      } else throw new Error("Invalid change path");
    }
  }
  out = ordered(out) as ObjectValue;
  return Card.parse(out);
}
function identity(
  id: string,
  name: string,
  known: { id: string; name: string }[],
  aliases: Record<string, string>,
): string {
  const exact = known.find((x) => x.id === id);
  if (exact) return exact.id;
  const alias =
    known.find((x) => x.id === aliases[id]) ||
    known.find((x) => x.id === aliases[name]);
  if (alias) return alias.id;
  // Auto-created IDs are slugged on first publication. Resolve that same ID
  // before names, which can legitimately repeat across regional tiers.
  const canonicalId = known.find((x) => x.id === slug(id));
  if (canonicalId) return canonicalId.id;
  const matches = [...new Map(known.map((x) => [x.id, x])).values()].filter(
    (x) => slug(x.name) === slug(name),
  );
  if (matches.length > 1)
    throw new Error(
      `Ambiguous identity: ${name}; declare an ID or alias in config.ts`,
    );
  return matches[0]?.id || slug(id || name);
}
function combinedOrigins(...values: unknown[]) {
  const origins = [...new Map(values.flatMap(value => Array.isArray(value) ? value : [value]).filter(value => value !== undefined).map(value => [canonical(value), value])).entries()]
    .sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  return origins.length === 1 ? origins[0] : origins;
}
function coalesceRules(values: ObjectValue[], field: string) {
  const seen = new Map<string, ObjectValue>(), descriptions = new Map<string, Set<string>>();
  for (const rule of values) {
    const id = String(rule.id), earlier = seen.get(id);
    if (earlier && !compatible(earlier, rule))
      throw new Error(`Ambiguous ${field} identity; conflicting rules share a scope: ${conflictDetails(earlier, rule)}`);
    const notes = descriptions.get(id) || new Set<string>();
    if (typeof rule.description === "string") notes.add(rule.description);
    descriptions.set(id, notes);
    seen.set(id, earlier ? { ...overlay(earlier, rule) as ObjectValue, source: combinedOrigins(earlier.source, rule.source) } : rule);
  }
  return [...seen.entries()].map(([id, rule]) => descriptions.get(id)!.size
    ? { ...rule, description: [...descriptions.get(id)!].sort().join("\n") }
    : rule);
}
function moneyCurrencies(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.flatMap(moneyCurrencies))].sort();
  if (!isObject(value)) return [];
  return [...new Set([
    ...(typeof value.amount === "string" && typeof value.currency === "string" ? [value.currency] : []),
    ...Object.values(value).flatMap(moneyCurrencies),
  ])].sort();
}
function rules(value: unknown, field: string, target: string, origin: unknown): unknown {
  if (!Array.isArray(value) || !["fees", "rewards", "limits"].includes(field)) return value;
  return coalesceRules(value.map(r => {
    const obj = ordered(r) as ObjectValue;
    const currencies = moneyCurrencies(obj);
    const id = `${field.slice(0, -1)}-${hash({
      target, kind: obj.kind || "cashback",
      serviceId: obj.kind === "other" ? obj.serviceId : undefined,
      rewardAsset: field === "rewards" ? obj.rewardAsset : undefined,
      requirements: field === "rewards" ? ordered(obj.requirements) : undefined,
      period: field === "limits" ? obj.period : undefined,
      currencies: currencies.length ? currencies : undefined,
      scope: ordered(obj.scope || {}),
    }).slice(0, 20)}`;
    return { ...obj, scope: ordered(obj.scope || {}), id, source: origin, status: "verified" };
  }), field);
}
function staticOrigin(v: unknown, path = "provider"): unknown {
  if (Array.isArray(v)) return v.map((x) => staticOrigin(x, path));
  if (!isObject(v)) return v;
  const out = { ...v },
    sources: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (featureFields.has(k)) {
      sources[k] = { origin: "static" };
      out[k] = rules(x, k, path, { origin: "static" });
    } else if (k === "products" || k === "tiers")
      out[k] = (x as ObjectValue[]).map((e) =>
        staticOrigin(e, `${path}/${e.id}`),
      );
  }
  if (Object.keys(sources).length) out.fieldSources = sources;
  return out;
}
function compatible(left: unknown, right: unknown, ruleArray = false): boolean {
  if (isObject(left) && isObject(right))
    return Object.keys(right)
      .filter((k) => !["source", "status", "id"].includes(k) && !(k === "description" && typeof left.calculable === "boolean" && left.calculable === right.calculable))
      .every((k) => !(k in left) || compatible(left[k], right[k]));
  if (
    Array.isArray(left) &&
    Array.isArray(right) &&
    ruleArray &&
    keyed(left) &&
    keyed(right)
  )
    return right.every((r) => {
      const old = left.find((x) => x.id === r.id);
      return !old || compatible(old, r);
    });
  return canonical(ordered(left)) === canonical(ordered(right));
}
function conflictDetails(first: unknown, second: unknown): string {
  if (keyed(first) && keyed(second)) {
    const right = second.find(rule => first.some(old => old.id === rule.id && !compatible(old, rule)));
    if (right) return conflictDetails(first.find(old => old.id === right.id), right);
  }
  const summary = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(summary);
    if (!isObject(value)) return value;
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["source", "status"].includes(key))
      .map(([key, item]) => [key, key === "description" && typeof item === "string" ? item.slice(0, 300) : summary(item)]));
  };
  return canonical({ first: summary(first), second: summary(second) }).slice(0, 4000);
}
export function candidate(
  adapter: Adapter,
  extractions: ExtractionData[],
  accepted?: CardData,
  documents: Document[] = [],
): { data: CardData; discrepancies: string[] } {
  if (extractions.some(extraction => !extraction.complete))
    throw new Error("Incomplete extraction cannot form a candidate");
  // Return the evidence failures together so one correction can fix a whole
  // candidate, rather than spending a model turn on each wrongly cited row.
  const evidenceErrors = extractions.flatMap(extraction => extraction.facts.flatMap((fact, index) => {
    if (!verifyEvidence(fact.evidence, documents)) return [`Invalid evidence: facts[${index}].${fact.field}`];
    try { verifyFinancialEvidence(fact); return []; }
    catch (error) { return [`facts[${index}]: ${error instanceof Error ? error.message : String(error)}`]; }
  }));
  // Report structural conflicts alongside wrong citations, rather than hiding
  // them until a later correction. Nothing can escape with invalid evidence.
  let built: ReturnType<typeof assembleCandidate>;
  try { built = assembleCandidate(adapter, extractions, accepted); }
  catch (error) {
    if (!evidenceErrors.length) throw error;
    throw new Error([...evidenceErrors.slice(0, 20), error instanceof Error ? error.message : String(error)].join("\n"));
  }
  if (evidenceErrors.length) throw new Error(evidenceErrors.slice(0, 20).join("\n"));
  return built;
}
function assembleCandidate(
  adapter: Adapter,
  extractions: ExtractionData[],
  accepted?: CardData,
): { data: CardData; discrepancies: string[] } {
  const knownProducts = [
    ...adapter.config.products,
    ...(accepted?.products || []),
  ];
  const productMap = new Map<string, string>();
  const tierMap = new Map<string, string>();
  let data: ObjectValue = {
    id: adapter.config.id,
    name: adapter.config.name,
    website: adapter.config.website,
    ...(adapter.config.products.length
      ? {
          products: adapter.config.products.map((p) => {
            const tiers = adapter.config.tiers
              .filter((t) => t.productId === p.id)
              .map(({ productId: _productId, ...t }) => t);
            return { ...p, ...(tiers.length ? { tiers } : {}) };
          }),
        }
      : {}),
  };
  const factsSeen = new Map<string, unknown>();
  const collectionSources = new Map<string, Map<string, Set<string>>>();
  const combined: ExtractionData = {
    complete: extractions.every((e) => e.complete),
    products: extractions
      .flatMap((e) => e.products)
      .sort((a, b) => a.id.localeCompare(b.id)),
    tiers: extractions
      .flatMap((e) => e.tiers)
      .sort((a, b) => a.id.localeCompare(b.id)),
    facts: extractions
      .flatMap((e) => e.facts)
      .sort((a, b) =>
        canonical([
          a.productId,
          a.tierId,
          a.field,
          a.evidence.url,
          a.evidence.blockId,
          a.value,
        ]).localeCompare(
          canonical([
            b.productId,
            b.tierId,
            b.field,
            b.evidence.url,
            b.evidence.blockId,
            b.value,
          ]),
        ),
      ),
  };
  for (const extraction of [combined]) {
    for (const p of extraction.products) {
      const id = identity(p.id, p.name, knownProducts, adapter.config.aliases);
      productMap.set(p.id, id);
      data = overlay(data, { products: [{ id, name: p.name }] }) as ObjectValue;
    }
    for (const t of extraction.tiers) {
      const productId = productMap.get(t.productId) || t.productId;
      const product = ((data.products || []) as ObjectValue[]).find(
        (p) => p.id === productId,
      );
      if (!product) throw new Error(`Unknown product for tier: ${t.productId}`);
      const known = [
        ...adapter.config.tiers.filter((x) => x.productId === productId),
        ...(accepted?.products?.find((x) => x.id === productId)?.tiers || []),
      ];
      const id = identity(t.id, t.name, known, adapter.config.aliases);
      tierMap.set(t.id, id);
      data = overlay(data, {
        products: [{ id: productId, tiers: [{ id, name: t.name }] }],
      }) as ObjectValue;
    }
    for (const fact of extraction.facts) {
      if (fact.tierId && !fact.productId)
        throw new Error("Tier fact requires productId");
      const productId = fact.productId
        ? productMap.get(fact.productId) || fact.productId
        : null;
      const tierId = fact.tierId
        ? tierMap.get(fact.tierId) || fact.tierId
        : null;
      const p = productId
        ? ((data.products || []) as ObjectValue[]).find(
            (p) => p.id === productId,
          )
        : null;
      if (productId && !p)
        throw new Error(`Unknown fact product: ${productId}`);
      if (
        tierId &&
        !(p?.tiers as ObjectValue[] | undefined)?.some((t) => t.id === tierId)
      )
        throw new Error(`Unknown fact tier: ${tierId}`);
      // Unknown isn't a deletion request. Keep accepted values until an explicit removal is reviewed.
      if (fact.value === null || fact.value === undefined) continue;
      const target = [adapter.config.id, productId, tierId]
        .filter(Boolean)
        .join("/");
      const scoped = Array.isArray(fact.value) && ["fees", "rewards", "limits"].includes(fact.field)
        ? fact.value.map((item) => {
            const rule = item as ObjectValue, scope = rule.scope as ObjectValue;
            if (!Array.isArray(scope.tierIds)) return rule;
            const ids = [...new Set(scope.tierIds.map(id => tierMap.get(String(id)) || adapter.config.aliases[String(id)] || String(id)))].sort();
            const products = p ? [p] : (data.products || []) as ObjectValue[];
            const allowed = new Set(products.flatMap(product => ((product.tiers || []) as ObjectValue[]).map(t => t.id)));
            if (ids.some(id => !allowed.has(id)))
              throw new Error(`Unknown tier in ${target}/${fact.field} rule scope; use the configured tier IDs`);
            if (tierId && (ids.length !== 1 || ids[0] !== tierId))
              throw new Error(`Rule tier scope differs from fact target ${target}; emit each tier's rules on its own target`);
            return { ...rule, scope: { ...scope, tierIds: ids } };
          })
        : fact.value;
      const value = rules(scoped, fact.field, target, fact.evidence);
      const factKey = `${target}/${fact.field}`;
      const earlier = factsSeen.get(factKey);
      // Assemble cited collection rows before comparing complete lists from
      // different sources. Financial rule conflicts still fail immediately.
      const additive = ["terms", "requirements", "features"].includes(fact.field) && Array.isArray(value);
      const collection = !["fees", "rewards", "limits"].includes(fact.field) && Array.isArray(value) && value.every(item => typeof item === "string");
      if (collection && Array.isArray(earlier) && (earlier.length === 0) !== (value.length === 0))
        throw new Error(`Explicit empty list conflicts with extracted values: ${factKey}; published values retained`);
      if (collection && !additive) {
        const sources = collectionSources.get(factKey) || new Map<string, Set<string>>();
        const items = sources.get(fact.evidence.url) || new Set<string>();
        for (const item of value as string[]) items.add(item);
        sources.set(fact.evidence.url, items);
        collectionSources.set(factKey, sources);
      }
      if (
        earlier !== undefined &&
        !collection &&
        !compatible(
          earlier,
          value,
          ["fees", "rewards", "limits"].includes(fact.field),
        )
      )
        throw new Error(
          `Conflicting extracted facts: ${factKey}; published values retained. Observations: ${conflictDetails(earlier, value)}`,
        );
      const combinedValue = collection && Array.isArray(earlier)
        ? ordered([...earlier, ...value as unknown[]])
        : Array.isArray(earlier) && ["fees", "rewards", "limits"].includes(fact.field)
          ? coalesceRules([...earlier, ...value as ObjectValue[]], fact.field)
          : overlay(earlier, value);
      factsSeen.set(factKey, combinedValue);
      const currentTarget = tierId
        ? (p?.tiers as ObjectValue[]).find((t) => t.id === tierId)
        : p || data;
      const priorOrigin = (currentTarget?.fieldSources as ObjectValue | undefined)?.[fact.field];
      const origin = priorOrigin ? combinedOrigins(priorOrigin, fact.evidence) : fact.evidence;
      const fields = {
        ...(fact.inherit
          ? {
              inheritFields: [
                ...new Set([
                  ...((currentTarget?.inheritFields || []) as string[]),
                  fact.field,
                ]),
              ],
            }
          : {}),
        [fact.field]: combinedValue,
        fieldSources: { [fact.field]: origin },
      };
      const patch = productId
        ? {
            products: [
              {
                id: productId,
                ...(tierId ? { tiers: [{ id: tierId, ...fields }] } : fields),
              },
            ],
          }
        : fields;
      data = overlay(data, patch) as ObjectValue;
    }
  }
  for (const [key, sources] of collectionSources) {
    const lists = [...sources.values()].map(items => canonical([...items].sort()));
    if (lists.some(list => list !== lists[0])) {
      const observations = [...sources].map(([url, items]) => ({
        url,
        differingValues: [...items].filter(item => [...sources.values()].some(other => !other.has(item))).sort(),
      }));
      throw new Error(`Conflicting extracted lists: ${key}; published values retained. Source differences: ${canonical(observations).slice(0, 4000)}. Check whether these describe the same program or a separate campaign; do not union incompatible eligibility lists.`);
    }
  }
  const { note: _note, sourceDate: _date, ...staticData } = adapter.static;
  const staticWithOrigin = staticOrigin(staticData, adapter.config.id);
  const discrepancies = diff(data, overlay(data, staticWithOrigin))
    .filter((c) => c.before !== undefined && !c.path.includes("fieldSources"))
    .map((c) => c.path.join("/"));
  data = overlay(data, staticWithOrigin) as ObjectValue;
  return { data: Card.parse(ordered(data)), discrepancies };
}
export function merge(accepted: CardData | undefined, incoming: CardData) {
  const combined = Card.parse(ordered(overlay(accepted || {}, incoming)));
  if (!accepted)
    return {
      published: combined,
      changes: [] as Change[],
      safeChanges: [] as Change[],
    };
  const changes = diff(accepted, combined);
  const unsafe = changes.filter((c) => {
    if (
      c.path.includes("fieldSources") ||
      c.path.includes("unconfirmedFields") ||
      ["source", "status"].some((k) => c.path.includes(k))
    )
      return false;
    if (c.before !== undefined || c.path.includes("inheritFields")) return true;
    // A new scoped rule beside an accepted rule can be a changed scope, so hold it.
    const ruleIndex = c.path.findIndex((p) =>
      ["fees", "rewards", "limits"].includes(p),
    );
    if (ruleIndex >= 0) {
      let current: unknown = accepted;
      for (const k of c.path.slice(0, ruleIndex + 1))
        current = Array.isArray(current)
          ? current.find((x) => x.id === k)
          : isObject(current)
            ? current[k]
            : undefined;
      if (Array.isArray(current) && current.length) return true;
    }
    // Identity changes/new entities in an existing catalog need human review.
    return c.path[0] === "products" && c.path.length <= 4;
  });
  const isCompanion = (c: Change) => {
    const field = c.path.indexOf("fieldSources"),
      source = c.path.indexOf("source"),
      status = c.path.indexOf("status");
    const group =
      field >= 0
        ? [...c.path.slice(0, field), c.path[field + 1]]
        : source >= 0
          ? c.path.slice(0, source)
          : status >= 0
            ? c.path.slice(0, status)
            : null;
    return (
      group !== null &&
      unsafe.some((u) => group.every((v, i) => u.path[i] === v))
    );
  };
  const companions = changes.filter(
    (c) => !unsafe.includes(c) && isCompanion(c),
  );
  const safeChanges = changes.filter(
    (c) => !unsafe.includes(c) && !companions.includes(c),
  );

  return {
    published: applyChanges(accepted, safeChanges),
    changes: [...unsafe, ...companions],
    safeChanges,
  };
}
export function markUnconfirmed(
  card: CardData,
  documents: Document[],
  extractions: ExtractionData[],
  incoming?: CardData,
): CardData {
  const seen = new Set(
    extractions.flatMap((x) =>
      x.facts.map(
        (f) =>
          `${f.productId || ""}/${f.tierId || ""}/${f.field}/${f.evidence.url}`,
      ),
    ),
  );
  const changed = new Set(
    documents.filter((d) => d.status === "ok").map((d) => d.url),
  );
  const visit = (v: unknown, product = "", tier = ""): unknown => {
    if (!isObject(v)) return v;
    const out = { ...v };
    const unconfirmed = new Set((v.unconfirmedFields || []) as string[]);
    for (const [field, origin] of Object.entries(
      (v.fieldSources || {}) as ObjectValue,
    ))
      {
        const origins = (Array.isArray(origin) ? origin : [origin]).filter(isObject);
        const affected = origins.filter(o => typeof o.url === "string" && changed.has(o.url));
        if (!affected.length) continue;
        if (affected.some(o => !seen.has(`${product}/${tier}/${field}/${o.url}`)))
          unconfirmed.add(field);
        else unconfirmed.delete(field);
      }
    const freshProduct = incoming?.products?.find((p) => p.id === product);
    const fresh: unknown = tier
      ? freshProduct?.tiers?.find((t) => t.id === tier)
      : product
        ? freshProduct
        : incoming;
    for (const field of ["fees", "rewards", "limits"])
      if (Array.isArray(v[field])) {
        out[field] = (v[field] as ObjectValue[]).map((rule) => {
          const origins = (Array.isArray(rule.source) ? rule.source : [rule.source]).filter(isObject);
          if (!origins.some(source => typeof source.url === "string" && changed.has(source.url)))
            return rule;
          const present =
            isObject(fresh) &&
            Array.isArray(fresh[field]) &&
            (fresh[field] as ObjectValue[]).some((r) => r.id === rule.id);
          if (!present) unconfirmed.add(field);
          return { ...rule, status: present ? "verified" : "unconfirmed" };
        });
      }
    if (unconfirmed.size) out.unconfirmedFields = [...unconfirmed].sort();
    else if (v.unconfirmedFields) out.unconfirmedFields = [];
    if (v.products)
      out.products = (v.products as ObjectValue[]).map((p) =>
        visit(p, String(p.id)),
      );
    if (v.tiers)
      out.tiers = (v.tiers as ObjectValue[]).map((t) =>
        visit(t, product, String(t.id)),
      );
    return out;
  };
  return Card.parse(visit(card));
}
export const publicationHash = (card: CardData) => hash(ordered(card));

export function unconfirmedChanges(card: CardData): Change[] {
  const changes: Change[] = [];
  const visit = (node: ObjectValue, path: string[]) => {
    if (Array.isArray(node.unconfirmedFields) && node.unconfirmedFields.length)
      changes.push({
        path: [...path, "unconfirmedFields"],
        // Uncertainty is already published safely. Review acknowledges the
        // retained facts; derive it from current state so a warm pass keeps
        // the same proposal instead of losing a transient before/after delta.
        before: node.unconfirmedFields,
        after: node.unconfirmedFields,
        reason: "Accepted facts were not found in changed source text; values retained for review",
      });
    for (const field of ["products", "tiers"])
      for (const child of (node[field] || []) as ObjectValue[])
        visit(child, [...path, field, String(child.id)]);
  };
  visit(card as ObjectValue, []);
  return changes;
}
export function describeChange(card: CardData, change: Change) {
  const path = change.path;
  const p = card.products?.find(
    (p) => p.id === path[path.indexOf("products") + 1],
  );
  const t = p?.tiers?.find((t) => t.id === path[path.indexOf("tiers") + 1]);
  const node = t || p || card;
  const kind = ["fees", "rewards", "limits"].find((k) => path.includes(k));
  const rule = kind
    ? (
        node[kind as "fees" | "rewards" | "limits"] as
          | { id: string; kind?: string; scope: Record<string, unknown> }[]
          | undefined
      )?.find((r) => r.id === path[path.indexOf(kind) + 1])
    : undefined;
  const label = (v: string) =>
    v === "ratePercent"
      ? "Rate (%)"
      : v.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  const scope = rule?.scope
    ? Object.entries(rule.scope)
        .map(([k, v]) => `${label(k)}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join(" · ")
    : "";
  return [
    card.name,
    p?.name,
    t?.name,
    rule?.kind
      ? `${rule.kind.toUpperCase()} ${kind === "fees" ? "fee" : "limit"}`
      : kind,
    scope,
    label(path.at(-1) || "Change"),
  ]
    .filter(Boolean)
    .join(" → ");
}
