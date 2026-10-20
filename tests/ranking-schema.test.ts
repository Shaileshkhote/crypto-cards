import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { AssetAmount, Card, Extraction, FeeRule, RewardRule, Scope, type Document } from '@cards/core/schema';
import { verifyFinancialEvidence } from '@cards/core/evidence';
import { Budget, extract, modelName } from '@cards/core/agent';
import { applicable, directory, filterDirectory, sortFees } from '@cards/core/cache';
import { candidate, merge, overlay, preserveSourceDisagreements } from '@cards/core/merge';
import { adapter } from './helpers';

// Manually labelled drafts against exact saved source blocks. These test the
// representation and extractor plumbing, not fresh LLM accuracy or publication.
const cases: { provider: string; label: string; field: string; evidence: { url: string; blockId: string; quote: string }; rule: Record<string, unknown> }[] = JSON.parse(readFileSync(new URL('./fixtures/ranking-source-examples.json', import.meta.url), 'utf8'));
function input(f: typeof cases[number]) {
  const doc: Document = { url: f.evidence.url, title: f.label, content: f.evidence.quote, hash: 'saved-source', status: 'ok', links: [], blocks: [{ id: f.evidence.blockId, text: f.evidence.quote }] };
  const draft = Extraction.parse({ complete: true, products: [], tiers: [], facts: [{ productId: 'card', tierId: 'core', field: f.field, value: [f.rule], evidence: f.evidence }] });
  return { doc, draft };
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.each(cases)('represents saved $provider: $label through the offline extractor', async f => {
  const { doc, draft } = input(f);
  const wire = structuredClone(draft);
  wire.facts[0].evidence.blockId = 'p1b1';
  let calls = 0;
  vi.stubEnv('OPENROUTER_API_KEY', 'offline-fixture-only');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === 'https://openrouter.ai/api/v1/models') return Response.json({ data: [{ id: modelName(), pricing: { prompt: '0', completion: '0' }, supported_parameters: ['tools', 'structured_outputs'] }] });
    if (url !== 'https://openrouter.ai/api/v1/chat/completions') throw Error('External network disabled');
    const request = JSON.parse(String(init?.body));
    expect(request.messages[0].content).toContain('fixed_plus_percentage');
    expect(request.messages[0].content).toContain('spendSchedule');
    expect(request.messages[0].content).toContain('cap.amount.asset');
    calls++;
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(wire) } }] });
  }));
  const a = adapter(); a.sources = { urls: [doc.url], allowedDomains: [new URL(doc.url).hostname] };
  const budget = new Budget(0);
  const result = await extract(a, [doc], budget);
  expect(calls).toBe(1);
  expect(budget.spent).toBe(0);
  expect(result.extraction.facts[0].value).toEqual(draft.facts[0].value);
  expect(() => verifyFinancialEvidence(result.extraction.facts[0])).not.toThrow();
  expect(() => candidate(a, [result.extraction], undefined, [doc])).not.toThrow();
});
it('rejects unsupported components, token units, cap amounts and dates in saved evidence', () => {
  for (const [index, modify, message] of [
    [0, (r: Record<string, unknown>) => { r.ratePercent = 99; }, 'Financial value 99'],
    [4, (r: Record<string, unknown>) => { r.cap = { amount: { amount: '100', asset: 'USDC' }, period: 'month' }; }, 'Reward asset USDC'],
    [4, (r: Record<string, unknown>) => { r.cap = { amount: { amount: '999', asset: 'USDT' }, period: 'month' }; }, 'Financial value 999'],
    [13, (r: Record<string, unknown>) => { r.scope = { validUntil: '2027-01-31' }; }, 'Validity date'],
  ] as const) {
    const { draft } = input(cases[index]);
    modify((draft.facts[0].value as Record<string, unknown>[])[0]);
    expect(() => verifyFinancialEvidence(draft.facts[0])).toThrow(message);
  }
});
it('keeps fiat money, token amounts, numeric rates, boolean boundaries and unknowns distinct', () => {
  expect(AssetAmount.parse({ amount: '001.500', asset: 'USDT' }).amount).toBe('1.5');
  expect(FeeRule.safeParse({ ...cases[0].rule, fixed: { amount: '0.3', currency: 'USDT' } }).success).toBe(false);
  expect(FeeRule.safeParse({ ...cases[0].rule, ratePercent: '1' }).success).toBe(false);
  expect(FeeRule.safeParse({ ...cases[0].rule, fixed: undefined }).success).toBe(false);
  expect(Scope.safeParse({ validFrom: '2026-02-30' }).success).toBe(false);
  expect(Scope.safeParse({ validFrom: '2026-10-01', validUntil: '2026-09-30' }).success).toBe(false);
  expect(RewardRule.safeParse({ ...cases[1].rule, ratePercent: 4 }).success).toBe(false);
  expect(RewardRule.safeParse({ id: 'x', scope: {}, calculable: true }).success).toBe(false);
  const schedule = structuredClone(cases[1].rule);
  const bands = (schedule.spendSchedule as { brackets: Record<string, unknown>[] }).brackets;
  bands[1].upperBound = { amount: '2000', currency: 'USD' };
  expect(RewardRule.safeParse(schedule).success).toBe(false);
  bands[1].upperBound = { amount: '4000', currency: 'EUR' };
  expect(RewardRule.safeParse(schedule).success).toBe(false);
  bands[1].upperBound = null;
  expect(RewardRule.safeParse(schedule).success).toBe(false);
  expect(RewardRule.safeParse({ ...cases[4].rule, cap: { amount: { amount: '100', currency: 'USD', asset: 'USDT' }, period: 'month' } }).success).toBe(false);
});
it('holds newly structured reward caps and schedules for existing financial review', () => {
  for (const f of [cases[1], cases[4]]) {
    const { doc, draft } = input(f);
    const a = adapter();
    const incoming = candidate(a, [draft], undefined, [doc]).data;
    const old = Card.parse({ id: a.config.id, name: a.config.name, website: a.config.website, products: [{ id: 'card', name: 'Card', tiers: [{ id: 'core', name: 'Core', rewards: [{ id: 'old', kind: 'cashback', ratePercent: 1, scope: {}, calculable: true }] }] }] });
    const merged = merge(old, incoming);
    expect(merged.published.products![0].tiers![0].rewards).toEqual(old.products![0].tiers![0].rewards);
    expect(merged.changes.some(c => c.path.includes('rewards'))).toBe(true);
  }
  const before = RewardRule.parse({ id: 'x', scope: {}, ratePercent: 1, calculable: true });
  const after = RewardRule.parse({ ...cases[1].rule, id: 'x' });
  expect(overlay(before, after)).toEqual(after);
  expect(overlay(after, before)).toEqual(before);
});
it('keeps restricted or compound rules out of simple fee sorting and includes banded rewards in filtering', () => {
  expect(applicable({ validUntil: '2026-01-31' }, {})).toBe(false);
  expect(applicable({ fundingAssets: ['USDC'] }, {})).toBe(false);
  const card = Card.parse({ id: 'test', name: 'Test', website: 'https://example.com', fees: [cases[0].rule], rewards: [cases[1].rule] });
  const rows = directory([card]);
  expect(filterDirectory(rows, { reward: true })).toHaveLength(1);
  const known = directory([Card.parse({ id: 'known', name: 'Known', website: 'https://example.com', fees: [{ id: 'known', kind: 'cross_border', scope: {}, calculation: 'percentage', ratePercent: 2, calculable: true }] })]);
  expect(sortFees([...rows, ...known], 'cross_border', { country: 'US', currency: 'USD' }).map(r => r.providerId)).toEqual(['known', 'test']);
});

it('retains flat-versus-banded source disagreement rather than accepting whichever draft is last', () => {
  const { doc, draft } = input(cases[1]);
  const flat = { ...draft.facts[0], value: [{ id: 'flat', kind: 'cashback', scope: { conditions: ['Standard tier'] }, ratePercent: 4, calculable: true }] };
  const otherDoc = { ...doc, url: doc.url + '?alternative' };
  const alternate = { ...flat, evidence: { ...flat.evidence, url: otherDoc.url } };
  for (const facts of [[draft.facts[0], alternate], [alternate, draft.facts[0]]]) {
    const result = preserveSourceDisagreements(Extraction.parse({ ...draft, facts }));
    expect(result.extraction.facts.map(f => f.field)).toEqual(['terms', 'terms']);
  }
});
it('corrects a token cap encoded as fiat money using the existing feedback loop', async () => {
  const { doc, draft } = input(cases[4]);
  const good = structuredClone(draft); good.facts[0].evidence.blockId = 'p1b1';
  const bad = JSON.parse(JSON.stringify(good));
  bad.facts[0].value[0].cap.amount = { amount: '100', currency: 'USDT' };
  let calls = 0;
  vi.stubEnv('OPENROUTER_API_KEY', 'offline-fixture-only');
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === 'https://openrouter.ai/api/v1/models') return Response.json({ data: [{ id: modelName(), pricing: { prompt: '0', completion: '0' }, supported_parameters: ['tools', 'structured_outputs'] }] });
    if (url !== 'https://openrouter.ai/api/v1/chat/completions') throw Error('External network disabled');
    if (++calls === 2) {
      expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain('token-denominated reward payout cap');
      expect(JSON.parse(String(init?.body)).messages.at(-1).content).toContain('exact cited unit');
    }
    return Response.json({ usage: { cost: 0 }, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(calls === 1 ? bad : good) } }] });
  }));
  const a = adapter(); a.sources = { urls: [doc.url], allowedDomains: [new URL(doc.url).hostname] };
  const result = await extract(a, [doc], new Budget(0));
  expect(calls).toBe(2);
  expect(result.extraction.facts[0].value).toEqual(draft.facts[0].value);
});

it('grounds equivalent unambiguous source date formats without accepting another date', () => {
  for (const text of ['Effective 1 September 2026. FX fee 2%.', 'Effective September 1, 2026. FX fee 2%.', 'Effective 2026-09-01. FX fee 2%.']) {
    const fact = Extraction.parse({ complete: true, products: [], tiers: [], facts: [{ productId: null, tierId: null, field: 'fees', value: [{ id: 'fx', kind: 'fx', calculation: 'percentage', ratePercent: 2, scope: { validFrom: '2026-09-01' }, calculable: true }], evidence: { url: 'https://example.com/fees', blockId: 'b', quote: text } }] }).facts[0];
    expect(() => verifyFinancialEvidence(fact)).not.toThrow();
    (fact.value as { scope: { validFrom: string } }[])[0].scope.validFrom = '2026-09-02';
    expect(() => verifyFinancialEvidence(fact)).toThrow('Validity date');
  }
});
