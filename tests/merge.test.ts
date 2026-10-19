import { describe, it, expect } from "vitest";
import {
  candidate,
  markUnconfirmed,
  merge,
  applyChanges,
  publicationHash,
} from "@cards/core/merge";
import { canonical } from "@cards/core/serialize";
import { adapter, document, extraction } from "./helpers";
import { Card } from "@cards/core/schema";
import { documentFromText } from "@cards/core/crawler";
describe("deterministic merge and protection", () => {
  it("rejects fee-free ATM allowances as hard limits while accepting separately stated withdrawal caps", () => {
    const doc = documentFromText("https://example.com/limits", "Tier | Basic ; Free ATM limit (Monthly) | USD 200 ; ATM withdrawal limit | Monthly USD 5000", "Limits", [], true), e = extraction(doc);
    e.facts[0] = { ...e.facts[0], field: "limits", value: [{ id: "atm", kind: "atm", amount: { amount: "200", currency: "USD" }, period: "month", scope: {}, calculable: true }] };
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("is an allowance, not a hard withdrawal limit");
    e.facts[0].value = [{ id: "atm", kind: "atm", amount: { amount: "5000", currency: "USD" }, period: "month", scope: {}, calculable: true }];
    expect(candidate(adapter(), [e], undefined, [doc]).data.products![0].tiers![0].limits![0]).toMatchObject({ amount: { amount: "5000" } });
    const both = documentFromText(doc.url, "Tier | Basic ; Free ATM limit (Monthly) | USD 200 ; ATM withdrawal limit (Monthly) | USD 200", "Limits", [], true);
    const same = extraction(both);
    same.facts[0] = { ...same.facts[0], field: "limits", value: [{ id: "atm", kind: "atm", amount: { amount: "200", currency: "USD" }, period: "month", scope: {}, calculable: true }] };
    expect(() => candidate(adapter(), [same], undefined, [both])).not.toThrow();
    const freePlan = documentFromText(doc.url, "Plan | Monthly amount ; Free plan ATM hard limit | USD 200", "Limits", [], true);
    const plan = extraction(freePlan);
    plan.facts[0] = { ...plan.facts[0], field: "limits", value: [{ id: "atm", kind: "atm", amount: { amount: "200", currency: "USD" }, period: "month", scope: {}, calculable: true }] };
    expect(() => candidate(adapter(), [plan], undefined, [freePlan])).not.toThrow();
  });
  it("keeps a zero-fee ATM threshold with a beyond-threshold charge out of hard amount and count limits", () => {
    const doc = documentFromText("https://example.com/fees", "Operation | Fee ; ATM withdrawal — up to 5 withdrawals or USD 200 per month (whichever first) | 0% ; ATM withdrawal beyond that limit | 2% ; Actual ATM hard cap | USD 5000 per month", "Fees", [], true), e = extraction(doc);
    e.facts[0].field = "limits";
    e.facts[0].value = [{ id: "atm", kind: "atm", scope: {}, amount: { amount: "200", currency: "USD" }, period: "month", calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("is an allowance, not a hard withdrawal limit");
    e.facts[0].value = [{ id: "count", kind: "transaction_count", scope: {}, count: 5, period: "month", calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("is an allowance, not a hard withdrawal limit");
    e.facts[0].value = [{ id: "atm", kind: "atm", scope: {}, amount: { amount: "5000", currency: "USD" }, period: "month", calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
    e.facts[0].field = "fees";
    e.facts[0].value = [{ id: "free", kind: "atm", scope: { conditions: ["First five withdrawals or USD 200 per month"] }, calculation: "percentage", ratePercent: 0, allowance: { amount: { amount: "200", currency: "USD" }, period: "month" }, calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
    const hard = documentFromText(doc.url, "Service | Fee ; ATM withdrawal hard limit up to USD 200 per month | 0%", "Fees", [], true), actual = extraction(hard);
    actual.facts[0].field = "limits";
    actual.facts[0].value = [{ id: "atm", kind: "atm", scope: {}, amount: { amount: "200", currency: "USD" }, period: "month", calculable: true }];
    expect(() => candidate(adapter(), [actual], undefined, [hard])).not.toThrow();
  });
  it("does not turn an unlimited withdrawal amount into zero while preserving explicit no-fee charges", () => {
    const doc = documentFromText("https://example.com/limits", "Yearly ATM withdrawal limit (USD): None."), e = extraction(doc);
    e.facts[0] = { ...e.facts[0], field: "limits", value: [{ id: "atm", kind: "atm", amount: { amount: "0", currency: "USD" }, period: "year", scope: {}, calculable: true }] };
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("Financial value 0 is absent");
    const fee = documentFromText(doc.url, "ATM fee: None."), free = extraction(fee, 0);
    free.facts[0].value = [{ id: "atm", kind: "atm", scope: {}, calculation: "percentage", ratePercent: 0, calculable: true }];
    expect(() => candidate(adapter(), [free], undefined, [fee])).not.toThrow();
  });
  it("keeps bank withdrawals over ACH separate from ATM cash withdrawals", () => {
    const doc = documentFromText("https://example.com/fees", "Withdraw CASH from your account using standard ACH: Free."), e = extraction(doc, 0);
    e.facts[0].value = [{ id: "withdrawal", kind: "atm", scope: { paymentRails: ["ach"] }, calculation: "percentage", ratePercent: 0, calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("are not ATM cash withdrawals");
    e.facts[0].value = [{ id: "withdrawal", kind: "other", serviceId: "bank-withdrawal", scope: { paymentRails: ["ach"] }, calculation: "percentage", ratePercent: 0, calculable: true }];
    expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
  });
  it("holds a legacy limit's calculability transition for review without leaking fields between variants", () => {
    const identity = { id: "example", name: "Example", website: "https://example.com" };
    const accepted = Card.parse({ ...identity, limits: [{ id: "legacy-limit", kind: "spending", period: "transaction", scope: {}, calculable: true, amount: { amount: "1000", currency: "USD" } }] });
    const unknown = Card.parse({ ...identity, limits: [{ id: "legacy-limit", kind: "spending", period: "transaction", scope: {}, calculable: false, description: "The limit now depends on the account." }] });
    const proposed = merge(accepted, unknown);
    expect(proposed.published).toEqual(accepted);
    expect(proposed.changes.some(change => change.path.at(-1) === "amount" && change.after === undefined)).toBe(true);
    expect(applyChanges(proposed.published, proposed.changes)).toEqual(unknown);
    const restored = merge(unknown, accepted);
    expect(restored.published).toEqual(unknown);
    expect(applyChanges(restored.published, restored.changes)).toEqual(accepted);
  });
  it("reuses normalized IDs and explicit aliases before repeated regional tier names", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "Tier 1 in region A: 1%. Tier 1 in region B: 2%."), e = extraction(doc);
    e.tiers = ["region-a--tier-1", "region-b--tier-1"].map(id => ({ id, name: "Tier 1", productId: "card" }));
    e.facts = e.tiers.map((tier, index) => ({ ...e.facts[0], tierId: tier.id, value: [{ id: "fx", kind: "fx", calculation: "percentage", ratePercent: index + 1, scope: {}, calculable: true }] }));
    const cold = candidate(a, [e], undefined, [doc]).data;
    expect(canonical(candidate(a, [e], cold, [doc]).data)).toBe(canonical(cold));
    a.config.aliases["old-region-a"] = "region-a-tier-1";
    const aliased = structuredClone(e);
    aliased.tiers[0].id = "old-region-a";
    aliased.facts[0].tierId = "old-region-a";
    expect(canonical(candidate(a, [aliased], cold, [doc]).data)).toBe(canonical(cold));
    const ambiguous = { ...e, tiers: [{ id: "unrelated-tier", name: "Tier 1", productId: "card" }], facts: [] };
    expect(() => candidate(a, [ambiguous], cold, [doc])).toThrow("Ambiguous identity");
  });
  it("assigns distinct stable identities to uncommon services", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "Statement copy: USD 10. Account letter: USD 3."), e = extraction(doc);
    const base = { kind: "other" as const, calculation: "fixed" as const, scope: {}, calculable: true as const };
    e.facts[0].value = [{ ...base, id: "copy", serviceId: "statement-copy", fixed: { amount: "10", currency: "USD" } }, { ...base, id: "letter", serviceId: "account-letter", fixed: { amount: "3", currency: "USD" } }];
    const fees = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!;
    expect(new Set(fees.map(fee => fee.id)).size).toBe(2);
    (e.facts[0].value as Record<string, unknown>[])[0].description = "Copy requested by the cardholder.";
    expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!.map(fee => fee.id)).toEqual(fees.map(fee => fee.id));
  });
  it("keeps distinct service fees stable when narrative changes", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "Card cancellation: 0. Chargeback: USD 50 per transaction."), e = extraction(doc);
    e.facts[0].value = [{ id: "cancel", kind: "cancellation", calculation: "percentage", ratePercent: 0, scope: {}, calculable: true }, { id: "dispute", kind: "chargeback", calculation: "fixed", fixed: { amount: "50", currency: "USD" }, scope: {}, calculable: true }];
    const fees = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!;
    expect(fees).toHaveLength(2);
    expect(new Set(fees.map(fee => fee.id)).size).toBe(2);
    (e.facts[0].value as Record<string, unknown>[])[1].description = "Formal chargeback.";
    expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!.map(fee => fee.id)).toEqual(fees.map(fee => fee.id));
  });
  it("retains opaque source statements without choosing a price and still rejects conflicting numeric bounds", () => {
    const a = adapter(), one = documentFromText("https://example.com/fees", "ATM fee: minimum $1 plus 0.65%."), two = documentFromText("https://example.com/help", "ATM fee: minimum $2 plus 1%.");
    const first = extraction(one), second = extraction(two);
    for (const [index, e] of [first, second].entries()) e.facts[0].value = [{ id: "atm", kind: "atm", calculation: "unknown", calculable: false, scope: {}, description: index ? two.content : one.content }];
    const rule = candidate(a, [first, second], undefined, [one, two]).data.products![0].tiers![0].fees![0];
    expect(rule).toMatchObject({ calculation: "unknown", calculable: false });
    expect(rule.description).toContain(one.content);
    expect(rule.description).toContain(two.content);
    for (const [index, e] of [first, second].entries()) (e.facts[0].value as Record<string, unknown>[])[0].minFee = { amount: String(index + 1), currency: "USD" };
    expect(() => candidate(a, [first, second], undefined, [one, two])).toThrow("Conflicting extracted facts");
  });
  it("deduplicates equal charges in one source block while preserving descriptions", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "ATM withdrawals: $0; international ATM withdrawals: $0. Operator fees may apply."), e = extraction(doc);
    const fee = { id: "atm", kind: "atm" as const, calculation: "fixed" as const, fixed: { amount: "0", currency: "USD" }, scope: {}, calculable: true as const };
    e.facts[0].value = [{ ...fee, description: "ATM withdrawals; operator fees may apply." }, { ...fee, description: "International ATM withdrawals; operator fees may apply." }];
    const fees = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!;
    expect(fees).toHaveLength(1);
    expect(fees[0].description).toContain("International ATM");
    expect(fees[0].description).toContain("ATM withdrawals; operator");
  });
  it("retains every source for equivalent charges across pages and marks missing evidence unconfirmed", () => {
    const a = adapter(), one = documentFromText("https://example.com/fees", "ATM withdrawal fee: 1.5%."), two = documentFromText("https://example.com/help", "ATM withdrawals cost 1.50%.");
    const first = extraction(one), second = extraction(two);
    for (const [index, e] of [first, second].entries()) e.facts[0].value = [{ id: "atm", kind: "atm", calculation: "percentage", ratePercent: 1.5, scope: {}, description: index ? "ATM withdrawals." : "ATM withdrawal charge.", calculable: true }];
    const out = candidate(a, [first, second], undefined, [one, two]).data;
    const rule = out.products![0].tiers![0].fees![0];
    expect(out.products![0].tiers![0].fees).toHaveLength(1);
    expect(rule.source).toHaveLength(2);
    expect(rule.description).toContain("ATM withdrawals.");
    expect(rule.description).toContain("ATM withdrawal charge.");
    expect(canonical(candidate(a, [second, first], undefined, [one, two]).data)).toBe(canonical(out));
    const absent = { ...first, facts: [] };
    expect(markUnconfirmed(out, [one, two], [absent], candidate(a, [absent], undefined, [one, two]).data).products![0].tiers![0].fees![0].status).toBe("unconfirmed");
  });
  it("assembles country rows from one source while rejecting different complete source lists", () => {
    const a = adapter(), doc = documentFromText("https://example.com/countries", "Germany\nFrance"), e = extraction(doc);
    e.facts = ["DE", "FR"].map((country, i) => ({ ...e.facts[0], field: "residentCountries", value: [country], evidence: { url: doc.url, blockId: doc.blocks[i].id, quote: doc.blocks[i].text } }));
    const out = candidate(a, [e], undefined, [doc]).data;
    expect(out.products![0].tiers![0].residentCountries).toEqual(["DE", "FR"]);
    const empty = { ...e, facts: [...e.facts, { ...e.facts[0], value: [] }] };
    expect(() => candidate(a, [empty], undefined, [doc])).toThrow("Explicit empty list conflicts");
    const different = { ...doc, url: "https://example.com/other" };
    e.facts.push({ ...e.facts[0], evidence: { ...e.facts[0].evidence, url: different.url } });
    expect(() => candidate(a, [e], undefined, [doc, different])).toThrow("Conflicting extracted lists");
  });
  it("combines complementary feature observations across pages without weakening eligibility checks", () => {
    const first = documentFromText("https://example.com/card", "Contactless payments supported."), second = documentFromText("https://example.com/benefits", "Travel insurance included.");
    const e = extraction(first);
    e.facts = [first, second].map((doc, index) => ({ productId: "card", tierId: null, inherit: false, field: "features", value: [index ? "Travel insurance" : "Contactless payments"], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text } }));
    const card = candidate(adapter(), [e], undefined, [first, second]).data;
    expect(card.products![0].features).toEqual(["Contactless payments", "Travel insurance"]);
    expect(card.products![0].fieldSources!.features).toHaveLength(2);
  });
  it("does not invent fixed-money currency for a zero percentage", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "Top-up fee: 0%."), e = extraction(doc);
    e.facts[0].value = [{ id: "topup", kind: "topup", scope: {}, calculation: "fixed", fixed: { amount: "0", currency: "USD" }, calculable: true }];
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("Money currency USD is absent");
    e.facts[0].value = [{ id: "topup", kind: "topup", scope: {}, calculation: "percentage", ratePercent: 0, calculable: true }];
    expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 0 });
  });
  it("does not treat a possible or refused waiver as an explicit free charge", () => {
    for (const text of ["Card upgrade: Not waived.", "Card upgrade: May be waived.", "The fee is not waived.", "The fee may be waived.", "An additional fee applies.", "Monthly, annual, or inactivity card fees may be waived.", "The bank may not charge fees.", "The bank may not be charged a fee.", "The bank doesn't waive the fee.", "The bank will not waive the fee.", "Call the toll-free number to ask about the monthly fee."]) {
      const doc = documentFromText("https://example.com/fees", text), e = extraction(doc, 0);
      expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("Financial value 0 is absent");
    }
  });
  it("keeps qualified dollar currencies distinct from unqualified dollars", () => {
    for (const [text, currency] of [["Close account: S$50", "SGD"], ["Close account: A$50", "AUD"], ["Close account: HK$50", "HKD"]]) {
      const doc = documentFromText("https://example.com/fees", text), e = extraction(doc);
      e.facts[0].value = [{ id: "close", kind: "cancellation", scope: {}, calculation: "fixed", fixed: { amount: "50", currency }, calculable: true }];
      expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
      (e.facts[0].value as { fixed: { currency: string } }[])[0].fixed.currency = "USD";
      expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("Money currency USD is absent");
    }
  });
  it("accepts definite absence of a fee while rejecting uncertain absence", () => {
    for (const text of ["The card does not have any monthly or annual fees.", "We don't have an annual fee.", "USD transactions do not incur an additional FX fee.", "Transaction fees are waived for the first $100 per month."]) {
      const doc = documentFromText("https://example.com/fees", text), e = extraction(doc, 0);
      expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
    }
    const doc = documentFromText("https://example.com/fees", "The card may not have any monthly or annual fees."), e = extraction(doc, 0);
    expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("Financial value 0 is absent");
  });
  it("accepts an explicit waived charge in a labeled value or table cell", () => {
    for (const text of ["Card upgrade: Waived", "Service | Price ; Card upgrade | Waived"]) {
      const doc = documentFromText("https://example.com/fees", text), e = extraction(doc, 0);
      e.facts[0].value = [{ id: "upgrade", kind: "other", serviceId: "card-upgrade", scope: {}, calculation: "percentage", ratePercent: 0, calculable: true }];
      expect(candidate(adapter(), [e], undefined, [doc]).data.products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 0 });
    }
  });
  it("accepts an explicit no-charge list with commas and conjunctions", () => {
    const doc = documentFromText("https://example.com/card", "Enjoy daily spending with no monthly, annual, or inactivity card fees."), e = extraction(doc, 0);
    e.facts[0].value = (["monthly", "annual", "inactivity"] as const).map(kind => ({ id: kind, kind, scope: {}, calculation: "percentage" as const, ratePercent: 0, calculable: true as const }));
    expect(candidate(adapter(), [e], undefined, [doc]).data.products![0].tiers![0].fees).toHaveLength(3);
    const contract = documentFromText("https://example.com/contract", "The issuer will not charge fees for overdraft or attempted overdraft."), statement = extraction(contract, 0);
    statement.facts[0].value = [{ id: "overdraft", kind: "other", serviceId: "overdraft", scope: {}, calculation: "percentage", ratePercent: 0, calculable: true }];
    expect(candidate(adapter(), [statement], undefined, [contract]).data.products![0].tiers![0].fees![0]).toMatchObject({ serviceId: "overdraft", ratePercent: 0 });
    for (const text of ["The bank doesn’t charge any additional fees.", "For this network you will not be charged a gas fee."]) {
      const source = documentFromText("https://example.com/fees", text);
      expect(candidate(adapter(), [extraction(source, 0)], undefined, [source]).data.products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 0 });
    }
  });
  it("supports short decimal-comma percentages while preserving thousands grouping", () => {
    const doc = documentFromText("https://example.com/fees", "Foreign exchange fee: 1,5%."), e = extraction(doc, 1.5);
    expect(candidate(adapter(), [e], undefined, [doc]).data.products![0].tiers![0].fees![0]).toMatchObject({ ratePercent: 1.5 });
    const grouped = documentFromText(doc.url, "Foreign exchange fee: 1,000%.");
    expect(() => candidate(adapter(), [extraction(grouped, 1)], undefined, [grouped])).toThrow("Financial value 1 is absent");
  });
  it("distinguishes monetary currencies in otherwise identical rules without hiding same-currency price conflicts", () => {
    const a = adapter(), doc = documentFromText("https://example.com/fees", "ATM fee: 2%, minimum 1.99 EUR or 1.99 GBP. The EUR minimum may instead be 2.99 EUR."), e = extraction(doc);
    const rules = (["EUR", "GBP"] as const).map(currency => ({ id: `atm-${currency.toLowerCase()}`, kind: "atm" as const, scope: {}, calculation: "percentage" as const, ratePercent: 2, minFee: { amount: "1.99", currency }, calculable: true as const }));
    e.facts[0].value = rules;
    const card = candidate(a, [e], undefined, [doc]).data;
    const fees = card.products![0].tiers![0].fees!;
    expect(fees).toHaveLength(2);
    expect(new Set(fees.map(fee => fee.id)).size).toBe(2);
    const changed = structuredClone(e);
    const changedRule = structuredClone(rules[0]);
    changedRule.minFee.amount = "2.99";
    changed.facts[0].value = [changedRule];
    const incoming = candidate(a, [changed], undefined, [doc]).data;
    expect(incoming.products![0].tiers![0].fees![0].id).toBe(fees.find(fee => fee.minFee?.currency === "EUR")!.id);
    const held = merge(card, incoming);
    expect(held.changes.length).toBeGreaterThan(0);
    expect(held.published).toEqual(card);
    expect(() => candidate(a, [e, changed], undefined, [doc])).toThrow("Conflicting extracted facts");
  });
  it("rejects a real citation to the wrong financial row and accepts explicit scaled amounts", () => {
    const a = adapter(), doc = documentFromText("https://example.com/limits", "Per purchase: 1.5k USD.\nAnnual transaction count: 1,040."), e = extraction(doc);
    e.facts[0] = { ...e.facts[0], field: "limits", value: [{ id: "count", kind: "transaction_count", count: 1040, period: "year", scope: {}, calculable: true }] };
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("1040 is absent");
    e.facts[0].value = [{ id: "spend", kind: "spending", amount: { amount: "1500", currency: "USD" }, period: "transaction", scope: {}, calculable: true }];
    expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].limits![0]).toMatchObject({ amount: { amount: "1500" } });
  });
  it("identifies all wrongly cited financial facts and their rules in one validation result", () => {
    const doc = documentFromText("https://example.com/fees", "Card issuance depends on card type."), e = extraction(doc);
    e.facts = ["virtual-issuance", "physical-issuance"].map((id, index) => ({ ...e.facts[0], value: [{ id, kind: "issuance", scope: {}, calculation: "fixed", fixed: { amount: String((index + 1) * 10), currency: "USD" }, calculable: true }] }));
    try { candidate(adapter(), [e], undefined, [doc]); throw new Error("Expected evidence rejection"); }
    catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("facts[0]");
      expect(message).toContain("facts[1]");
      expect(message).toContain("virtual-issuance");
      expect(message).toContain("physical-issuance");
      expect(message).toContain("Money currency USD is absent");
      expect(message).toContain("Financial value 10 is absent");
      expect(message).toContain("Financial value 20 is absent");
      expect(message).toContain("Conflicting extracted facts");
      expect(message).toContain(doc.url);
    }
  });
  it("keeps separately cited narrative clauses and detects a missing contributing source", () => {
    const a = adapter(), first = document(), second = documentFromText("https://example.com/eligibility", "Applicants must be adults.");
    const evidence = (doc: typeof first) => ({ url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text });
    const e = extraction(first);
    e.facts = [first, second].map((doc, i) => ({ field: "requirements", inherit: false, productId: "card", tierId: null, value: [i ? "Must be an adult" : "Verification required"], evidence: evidence(doc) }));
    const out = candidate(a, [e], undefined, [first, second]).data;
    expect(out.products![0].requirements).toEqual(["Must be an adult", "Verification required"]);
    expect(out.products![0].fieldSources!.requirements).toEqual([evidence(second), evidence(first)]);
    const regrouped = e.facts.map(f => ({ ...e, facts: [f] })).reverse();
    expect(canonical(candidate(a, regrouped, undefined, [first, second]).data)).toBe(canonical(out));
    const partial = { ...e, facts: e.facts.slice(0, 1) };
    expect(markUnconfirmed(out, [first, second], [partial]).products![0].unconfirmedFields).toContain("requirements");
  });
  it("preserves cash and points rewards independently while rejecting conflicting rates in one asset", () => {
    const a = adapter(), doc = documentFromText("https://example.com/rewards", "Rewards: 2% USD and 2% Points; another advertised USD rate is 3%."), e = extraction(doc);
    const reward = { id: "reward", scope: {}, ratePercent: 2, rewardAsset: "USD", calculable: true };
    e.facts[0] = { ...e.facts[0], field: "rewards", value: [reward, { ...reward, rewardAsset: "Points" }] };
    const out = candidate(a, [e], undefined, [doc]).data;
    expect(out.products![0].tiers![0].rewards).toHaveLength(2);
    e.facts[0].value = [reward, { ...reward, ratePercent: 3 }];
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("Ambiguous rewards");
  });
  it("keeps conditional reward rates separate and rejects different rates for the same conditions", () => {
    const a = adapter(), doc = documentFromText("https://example.com/rewards", "Rewards: 2% with 100 USD staked; 3% with 500 USD staked."), e = extraction(doc);
    const reward = { id: "reward", scope: {}, ratePercent: 2, rewardAsset: "USD", requirements: ["Stake 100 USD"], calculable: true };
    e.facts[0] = { ...e.facts[0], field: "rewards", value: [reward, { ...reward, ratePercent: 3, requirements: ["Stake 500 USD"] }] };
    expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].rewards).toHaveLength(2);
    e.facts[0].value = [reward, { ...reward, ratePercent: 3 }];
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("Ambiguous rewards");
  });
  it("rejects rules scoped to a different tier than their fact target", () => {
    const a = adapter(), doc = document(), e = extraction(doc);
    const rule = (e.facts[0].value as { scope: { tierIds?: string[] } }[])[0];
    rule.scope.tierIds = ["luxe"];
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("Rule tier scope differs");
    rule.scope.tierIds = ["missing-tier"];
    expect(() => candidate(a, [e], undefined, [doc])).toThrow("Unknown tier");
    a.config.aliases["legacy-core"] = "core";
    rule.scope.tierIds = ["legacy-core"];
    const out = candidate(a, [e], undefined, [doc]).data;
    expect(out.products![0].tiers![0].fees![0].scope.tierIds).toEqual(["core"]);
  });
  it("keeps lifecycle and retirement metadata owned by adapter configuration", () => {
    const a = adapter(), doc = document(), e = extraction(doc);
    a.config.products[0].lifecycle = "retired";
    a.config.products[0].retiredAt = "2026-08-29";
    a.config.tiers[0].lifecycle = "retired";
    a.config.tiers[0].retiredAt = "2026-08-29";
    e.products = [{ id: "card", name: "Card", lifecycle: "active", retiredAt: null }];
    e.tiers = [{ id: "core", name: "Core", productId: "card", lifecycle: "active", retiredAt: null }];
    const product = candidate(a, [e], undefined, [doc]).data.products![0];
    expect(product).toMatchObject({ lifecycle: "retired", retiredAt: "2026-08-29" });
    expect(product.tiers?.find(t => t.id === "core")).toMatchObject({ lifecycle: "retired", retiredAt: "2026-08-29" });
  });
  it("produces byte-identical data for the same accepted snapshot", () => {
    const a = adapter(),
      doc = document(),
      e = extraction(doc);
    const first = candidate(a, [e], undefined, [doc]).data;
    const again = candidate(a, [e], first, [doc]).data;
    expect(canonical(merge(first, again).published)).toBe(canonical(first));
    expect(publicationHash(again)).toBe(publicationHash(first));
  });
  it("holds financial edits and applies only the reviewed path", () => {
    const a = adapter(),
      old = document(),
      next = document(2);
    const accepted = candidate(a, [extraction(old)], undefined, [old]).data;
    const incoming = candidate(a, [extraction(next, 2)], accepted, [next]).data;
    const result = merge(accepted, incoming);
    expect(canonical(result.published)).toBe(canonical(accepted));
    expect(result.changes.some((c) => c.path.at(-1) === "ratePercent")).toBe(
      true,
    );
    const approved = applyChanges(result.published, result.changes);
    expect(approved.products?.[0].tiers?.[0].fees?.[0]).toMatchObject({
      ratePercent: 2,
    });
    expect(approved.products?.[0].tiers?.[1]).toEqual(
      accepted.products?.[0].tiers?.[1],
    );
  });
  it("preserves unrelated rules on a partial source result", () => {
    const accepted = Card.parse({
      id: "example",
      name: "Example",
      website: "https://example.com",
      fees: [
        {
          id: "monthly",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "10", currency: "EUR" },
          scope: {},
          calculable: true,
        },
      ],
    });
    expect(
      merge(accepted, {
        id: "example",
        name: "Example",
        website: "https://example.com",
      }).published,
    ).toEqual(accepted);
  });
  it("gives explicit static zero and false precedence and queues subsequent edits", () => {
    const a = adapter(),
      doc = document();
    a.static = {
      kyc: false,
      fees: [
        {
          id: "static-fee",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "0", currency: "EUR" },
          scope: {},
          calculable: true,
        },
      ],
    };
    const data = candidate(a, [], undefined, []).data;
    expect(data.kyc).toBe(false);
    expect(data.fees?.[0]).toMatchObject({
      fixed: { amount: "0" },
      source: { origin: "static" },
    });
    a.static.kyc = true;
    expect(merge(data, candidate(a, [], data, [doc]).data).published.kyc).toBe(
      false,
    );
  });
  it("treats explicit empty fee lists as removals requiring review", () => {
    const a = adapter();
    a.static = {
      fees: [
        {
          id: "monthly",
          kind: "monthly",
          calculation: "fixed",
          fixed: { amount: "0", currency: "USD" },
          scope: {},
          calculable: true,
        },
      ],
    };
    const old = candidate(a, []).data;
    a.static.fees = [];
    const r = merge(old, candidate(a, []).data);
    expect(r.changes.length).toBeGreaterThan(0);
    expect(r.published.fees).toHaveLength(1);
    expect(applyChanges(r.published, r.changes).fees).toEqual([]);
  });
  it("rejects bogus citations and incomplete results", () => {
    const a = adapter(),
      doc = document(),
      e = extraction(doc);
    e.facts[0].evidence.quote = "made up";
    expect(() => candidate(a, [e], undefined, [doc])).toThrow(
      "Invalid evidence",
    );
    e.complete = false;
    expect(() => candidate(a, [e])).toThrow("Incomplete");
  });
});
it("does not depend on extraction grouping or fact order across documents", () => {
  const a = adapter(),
    one = document(),
    two = { ...document(), url: "https://example.com/second" };
  const e1 = extraction(one),
    e2 = extraction(two);
  e2.facts[0].evidence.url = two.url;
  const grouped = {
    complete: true,
    products: [],
    tiers: [],
    facts: [...e2.facts, ...e1.facts],
  };
  expect(canonical(candidate(a, [grouped], undefined, [one, two]).data)).toBe(
    canonical(candidate(a, [e1, e2], undefined, [one, two]).data),
  );
});
it("refuses conflicting interpretations from two valid source quotes", () => {
  const a = adapter(),
    one = document(),
    two = { ...document(2), url: "https://example.com/second" },
    e1 = extraction(one),
    e2 = extraction(two, 2);
  e2.facts[0].evidence.url = two.url;
  expect(() => candidate(a, [e1, e2], undefined, [one, two])).toThrow(
    "Conflicting extracted facts",
  );
});
it("gives daily and monthly limits separate identities without value-based IDs", () => {
  const a = adapter(),
    doc = documentFromText("https://example.com/limits", "Spending limits: 100 USD daily; 1,000 USD monthly."),
    e = extraction(doc);
  e.facts[0].field = "limits";
  e.facts[0].value = [
    {
      id: "one",
      kind: "spending",
      amount: { amount: "100", currency: "USD" },
      period: "day",
      scope: {},
      calculable: true,
    },
    {
      id: "two",
      kind: "spending",
      amount: { amount: "1000", currency: "USD" },
      period: "month",
      scope: {},
      calculable: true,
    },
  ];
  const out = candidate(a, [e], undefined, [doc]).data;
  expect(
    new Set(out.products?.[0].tiers?.[0].limits?.map((x) => x.id)).size,
  ).toBe(2);
});
it("keeps actual card services as separate charges rather than generic transactions", () => {
  const a = adapter(), doc = documentFromText("https://example.com/fees", "ATM, declines, balance inquiries, cross-border, late payments, returned payments and delivery each cost 0.60 USD."), e = extraction(doc);
  e.facts[0].value = (["atm", "atm_decline", "atm_balance_inquiry", "cross_border", "late_payment", "returned_payment", "delivery"] as const).map(kind => ({
    id: kind, kind,
    calculation: "fixed" as const, fixed: { amount: "0.6", currency: "USD" },
    scope: {}, calculable: true as const,
  }));
  const fees = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].fees!;
  expect(new Set(fees.map(f => f.id)).size).toBe(7);
});
it("distinguishes per-purchase, daily-money and daily-count limits", () => {
  const a = adapter(), doc = documentFromText("https://example.com/limits", "Spending: 80,000 USD per purchase; 1,000,000 USD daily; 50 transactions daily."), e = extraction(doc);
  e.facts[0].field = "limits";
  e.facts[0].value = [
    { id: "purchase", kind: "spending", amount: { amount: "80000", currency: "USD" }, period: "transaction", scope: {}, calculable: true },
    { id: "daily", kind: "spending", amount: { amount: "1000000", currency: "USD" }, period: "day", scope: {}, calculable: true },
    { id: "count", kind: "transaction_count", count: 50, period: "day", scope: {}, calculable: true },
  ];
  const limits = candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].limits!;
  expect(new Set(limits.map(l => l.id)).size).toBe(3);
  expect(limits.find(l => l.kind === "transaction_count")).toMatchObject({ count: 50 });
  expect(limits.find(l => l.kind === "transaction_count")).not.toHaveProperty("amount");
});
it("replaces extracted provenance and fee variants with explicit static values through review", () => {
  const a = adapter(),
    doc = document();
  const accepted = candidate(a, [extraction(doc)], undefined, [doc]).data;
  a.static = {
    products: [
      {
        id: "card",
        name: "Card",
        tiers: [
          {
            id: "core",
            name: "Core",
            fees: [
              {
                id: "manual",
                kind: "fx",
                calculation: "fixed",
                fixed: { amount: "0", currency: "USD" },
                scope: { residentCountries: ["DE"] },
                calculable: true,
              },
            ],
          },
        ],
      },
    ],
  };
  const built = candidate(a, [extraction(doc)], accepted, [doc]).data;
  const proposed = merge(accepted, built);
  expect(proposed.published).toEqual(accepted);
  const approved = applyChanges(proposed.published, proposed.changes);
  const rule = approved.products?.[0].tiers?.[0].fees?.[0];
  expect(rule).toMatchObject({
    calculation: "fixed",
    fixed: { amount: "0", currency: "USD" },
    source: { origin: "static" },
  });
  expect(rule).not.toHaveProperty("ratePercent");
  expect(rule?.source).not.toHaveProperty("quote");
  expect(approved.products?.[0].tiers?.[0].fieldSources?.fees).toEqual({
    origin: "static",
  });
});

it("scopes an explicit zero addition to provider markup and preserves the network charge", () => {
  const doc = documentFromText("https://example.com/pricing", "This 1% is the network fee. The app doesn't add anything on top."), e = extraction(doc, 0);
  e.facts[0].value = [{ id: "markup", kind: "fx", scope: { conditions: ["Provider markup only"] }, calculation: "percentage", ratePercent: 0, calculable: true }];
  expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
  e.facts[0].value = [{ id: "total", kind: "fx", scope: {}, calculation: "percentage", ratePercent: 0, calculable: true }];
  expect(() => candidate(adapter(), [e], undefined, [doc])).toThrow("not a zero total charge");
  const uncertain = documentFromText(doc.url, "This 1% is the network fee. The app may not add anything on top.");
  expect(() => candidate(adapter(), [extraction(uncertain, 0)], undefined, [uncertain])).toThrow("Financial value 0 is absent");
});

it("rejects a country inventory cited to a heading instead of the country rows", () => {
  const a = adapter(), doc = documentFromText("https://example.com/countries", "The card is currently available in:\nSingapore, mainland China.\nUK and Hong Kong.\nMyanmar.\nCôte d'Ivoire, Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines, Trinidad and Tobago, UAE.");
  const e = extraction(doc);
  const claim = { ...e.facts[0], field: "residentCountries", value: ["SG", "CN"], evidence: { url: doc.url, blockId: doc.blocks[0].id, quote: doc.blocks[0].text } };
  e.facts = [claim];
  expect(() => candidate(a, [e], undefined, [doc])).toThrow("Country values SG, CN are absent");
  e.facts = [{ ...claim, evidence: { ...claim.evidence, blockId: doc.blocks[1].id, quote: doc.blocks[1].text } }];
  expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].residentCountries).toEqual(["CN", "SG"]);
  e.facts = [{ ...claim, value: ["GB", "HK"], evidence: { ...claim.evidence, blockId: doc.blocks[2].id, quote: doc.blocks[2].text } }];
  expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].residentCountries).toEqual(["GB", "HK"]);
  e.facts = [{ ...claim, value: ["MM"], evidence: { ...claim.evidence, blockId: doc.blocks[3].id, quote: doc.blocks[3].text } }];
  expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].residentCountries).toEqual(["MM"]);
  e.facts = [{ ...claim, value: ["CI", "KN", "LC", "VC", "TT", "AE"], evidence: { ...claim.evidence, blockId: doc.blocks[4].id, quote: doc.blocks[4].text } }];
  expect(candidate(a, [e], undefined, [doc]).data.products![0].tiers![0].residentCountries).toEqual(["AE", "CI", "KN", "LC", "TT", "VC"]);
  e.facts = [{ ...claim, value: ["IN"], evidence: { ...claim.evidence, quote: doc.blocks[0].text } }];
  expect(() => candidate(a, [e], undefined, [doc])).toThrow("Country values IN are absent");
});

it("rejects invented card types and calendar periods while keeping explicitly sourced claims", () => {
  const a = adapter();
  const physical = documentFromText("https://example.com/card", "Physical cards are available in Singapore.");
  const e = extraction(physical);
  e.facts = [{ ...e.facts[0], field: "cardTypes", value: { physical: true, virtual: true } }];
  expect(() => candidate(a, [e], undefined, [physical])).toThrow("virtual card availability is absent");
  e.facts[0].value = { physical: true };
  expect(candidate(a, [e], undefined, [physical]).data.products![0].tiers![0].cardTypes).toEqual({ physical: true });
  const annual = documentFromText("https://example.com/fees", "0 annual fee");
  e.facts = [{ ...extraction(annual).facts[0], value: [{ id: "monthly", kind: "monthly", calculation: "percentage", ratePercent: 0, scope: {}, calculable: true }] }];
  expect(() => candidate(a, [e], undefined, [annual])).toThrow("Period month is absent");
  const consecutive = documentFromText("https://example.com/limits", "A PIN is required after 5 consecutive contactless payments.");
  e.facts = [{ ...extraction(consecutive).facts[0], field: "limits", value: [{ id: "count", kind: "transaction_count", count: 5, period: "day", scope: {}, calculable: true }] }];
  expect(() => candidate(a, [e], undefined, [consecutive])).toThrow("Period day is absent");
  const daily = documentFromText(consecutive.url, "At most 5 ATM withdrawals per 24-hour period.");
  e.facts[0].evidence = { url: daily.url, blockId: daily.blocks[0].id, quote: daily.blocks[0].text };
  expect(candidate(a, [e], undefined, [daily]).data.products![0].tiers![0].limits![0]).toMatchObject({ count: 5, period: "day" });
});

it("does not assign a late-payment clause to returned-payment fees", () => {
  const a = adapter(), doc = documentFromText("https://example.com/card-terms", "Late payment: up to $40.");
  const e = extraction(doc);
  e.facts[0].value = [{ id: "returned", kind: "returned_payment", calculation: "unknown", calculable: false, scope: {}, description: doc.blocks[0].text }];
  expect(() => candidate(a, [e], undefined, [doc])).toThrow("A late-payment clause does not support a returned-payment charge");
  const returned = documentFromText(doc.url, "A returned or reversed payment incurs a fee of $5.");
  e.facts[0].value = [{ id: "returned", kind: "returned_payment", calculation: "fixed", calculable: true, scope: {}, fixed: { amount: "5", currency: "USD" } }];
  e.facts[0].evidence = { url: returned.url, blockId: returned.blocks[0].id, quote: returned.blocks[0].text };
  expect(candidate(a, [e], undefined, [returned]).data.products![0].tiers![0].fees![0]).toMatchObject({ kind: "returned_payment", fixed: { amount: "5" } });
});

it('recognizes an explicit /mo subscription or withdrawal cap without inventing a month from an annual fee', () => {
  for (const [text, field, value] of [
    ['Subscribe for $14.99/mo', 'fees', [{ id: 'subscription', kind: 'monthly', calculation: 'fixed', fixed: { amount: '14.99', currency: 'USD' }, scope: {}, calculable: true }]],
    ['Withdraw up to £750 a day (or up to £4,000/mo).', 'limits', [{ id: 'monthly-atm', kind: 'atm', amount: { amount: '4000', currency: 'GBP' }, period: 'month', scope: {}, calculable: true }]],
  ] as const) {
    const doc = documentFromText('https://example.com/pricing', text), e = extraction(doc);
    e.facts[0] = { ...e.facts[0], field, value: structuredClone(value) } as typeof e.facts[0];
    expect(() => candidate(adapter(), [e], undefined, [doc])).not.toThrow();
  }
});
