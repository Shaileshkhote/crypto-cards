import { z } from "zod";
import countries from "i18n-iso-countries";
import { compareDecimals } from "./serialize";

export const SCHEMA_VERSION = "8";
export const Id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/)
  .max(180);
export const Country = z
  .enum(Object.keys(countries.getAlpha2Codes()) as [string, ...string[]])
  .describe("ISO 3166-1 alpha-2 country code, such as US, DE or GB. Region labels such as EU, EEA and APAC belong in regions, never country arrays.");
export const Currency = z
  .enum(Intl.supportedValuesOf("currency") as [string, ...string[]])
  .describe("ISO 4217 currency code. Offshore aliases such as CNH are not ISO codes; preserve unsupported currencies in an unknown rule's description, never substitute another currency.");
export const Money = z
  .object({
    amount: z.string().regex(/^\d+(\.\d+)?$/)
      .transform(value => value.replace(/^0+(?=\d)/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")),
    currency: Currency,
  })
  .strict();
export const Period = z.enum(["day", "week", "month", "year"]);
export const Weekday = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export const Evidence = z
  .object({
    url: z.string().url(),
    blockId: z.string().min(1),
    quote: z.string().min(1),
  })
  .strict();
export const Origin = z.union([
  Evidence,
  z
    .object({ origin: z.literal("static"), note: z.string().optional() })
    .strict(),
]);
export const Origins = z.union([Origin, z.array(Origin).min(1)]);
export const Scope = z
  .object({
    residentCountries: z.array(Country).nullable().optional(),
    excludedResidentCountries: z.array(Country).optional(),
    regions: z.array(z.string()).optional(),
    transactionCountries: z.array(Country).optional(),
    transactionCurrencies: z.array(Currency).optional(),
    excludedTransactionCurrencies: z.array(Currency).optional(),
    fundingCurrencies: z.array(Currency).optional(),
    merchantCategories: z.array(z.string()).optional(),
    tierIds: z.array(Id).optional(),
    cardTypes: z.array(z.enum(["physical", "virtual"])).optional(),
    cardOrder: z.enum(["first", "additional"]).optional(),
    paymentRails: z.array(z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i)
      .transform(value => value.toLowerCase().replaceAll("_", "-")).pipe(Id)).optional(),
    daysOfWeek: z.array(Weekday).optional(),
    conditions: z.array(z.string().min(1)).min(1)
      .describe("Explicit source conditions not represented by another scope field, such as metal/plastic material, asset conversion or spending bands. Preserve the condition; never invent one to resolve conflicting prices.")
      .optional(),
  })
  .strict();
const RuleBase = {
  id: Id,
  scope: Scope,
  description: z.string().optional(),
  source: Origins.optional(),
  status: z.enum(["verified", "unconfirmed"]).optional(),
};
const FeeBase = {
  ...RuleBase,
  kind: z.enum([
    "fx",
    "conversion",
    "atm",
    "cash_advance",
    "atm_decline",
    "atm_balance_inquiry",
    "monthly",
    "annual",
    "issuance",
    "transaction",
    "topup",
    "replacement",
    "inactivity",
    "refund",
    "delivery",
    "cross_border",
    "late_payment",
    "returned_payment",
    "cancellation",
    "chargeback",
    "transaction_decline",
    "small_transaction",
    "other",
  ]).describe("fx is fiat currency exchange; conversion is crypto/asset conversion. atm is withdrawal; atm_decline and atm_balance_inquiry are separate services. refund applies only to processing a refund. delivery is shipping, separate from issuance. cross_border, late_payment and returned_payment are separate from ordinary purchase transaction fees."),
  minFee: Money.optional(),
  serviceId: Id.describe("Required only for kind other: stable kebab-case name of the charged service. Omit for known kinds.").optional(),
  maxFee: Money.optional(),
  allowance: z.object({ amount: Money, period: Period }).strict().optional(),
};
export const FeeRule = z
  .discriminatedUnion("calculation", [
    z
      .object({
        ...FeeBase,
        calculation: z.literal("fixed"),
        fixed: Money,
        calculable: z.literal(true),
      })
      .strict(),
    z
      .object({
        ...FeeBase,
        calculation: z.literal("percentage"),
        ratePercent: z.number().finite().nonnegative(),
        calculable: z.literal(true),
      })
      .strict(),
    z
      .object({
        ...FeeBase,
        calculation: z.literal("tiered"),
        brackets: z
          .array(
            z
              .object({
                upperBound: Money.nullable(),
                inclusive: z.boolean(),
                ratePercent: z.number().finite().nonnegative(),
              })
              .strict(),
          )
          .min(1),
        mode: z.enum(["marginal", "whole_amount"]),
        period: Period,
        calculable: z.literal(true),
      })
      .strict(),
    z
      .object({
        ...FeeBase,
        calculation: z.literal("unknown"),
        description: z.string().min(1),
        calculable: z.literal(false),
      })
      .strict(),
  ])
  .superRefine((r, ctx) => {
    if (r.kind === "other" && !r.serviceId)
      ctx.addIssue({ code: "custom", path: ["serviceId"], message: "Other fee requires a stable serviceId" });
    if (r.kind !== "other" && r.serviceId)
      ctx.addIssue({ code: "custom", path: ["serviceId"], message: "serviceId is only for kind other" });
    if (r.calculation === "tiered") {
      const c = r.brackets[0]?.upperBound?.currency;
      let last: string | undefined;
      r.brackets.forEach((b, i) => {
        if (b.upperBound === null) {
          if (i !== r.brackets.length - 1)
            ctx.addIssue({
              code: "custom",
              message: "Unbounded bracket must be last",
            });
        } else {
          const n = b.upperBound.amount;
          if (
            (last !== undefined && compareDecimals(n, last) <= 0) ||
            b.upperBound.currency !== c
          )
            ctx.addIssue({
              code: "custom",
              message: "Bracket thresholds must increase in one currency",
            });
          last = n;
        }
      });
    }
  });
export const RewardRule = z
  .object({
    ...RuleBase,
    kind: z.enum(["cashback", "salary_match", "yield", "referral", "other"])
      .describe("Identify the actual reward program; salary matching and yield are separate from purchase cashback.")
      .optional(),
    ratePercent: z.number().finite().nonnegative().optional(),
    rewardAsset: z.string().optional(),
    cap: z
      .object({ amount: Money, period: z.enum(["month", "year"]) })
      .strict()
      .optional(),
    requirements: z.array(z.string()).optional(),
    calculable: z.boolean(),
  })
  .strict()
  .superRefine((r, c) => {
    if (r.calculable && r.ratePercent === undefined)
      c.addIssue({
        code: "custom",
        message: "Calculable reward requires ratePercent",
      });
    if (!r.calculable && !r.description)
      c.addIssue({
        code: "custom",
        message: "Non-calculable reward requires description",
      });
  });
const LimitPeriod = Period.or(z.literal("transaction"));
export const LimitRule = z.union([
  z.object({
    ...RuleBase,
    kind: z.enum(["spending", "atm"]),
    amount: Money,
    period: LimitPeriod,
    calculable: z.literal(true),
  }).strict(),
  z.object({
    ...RuleBase,
    kind: z.literal("transaction_count"),
    count: z.number().int().nonnegative(),
    period: Period,
    calculable: z.literal(true),
  }).strict(),
  z.object({
    ...RuleBase,
    kind: z.enum(["spending", "atm", "transaction_count"]),
    period: LimitPeriod.optional(),
    description: z.string().min(1),
    calculable: z.literal(false),
  }).strict(),
]);
export const FeatureShape = {
  network: z.enum(["visa", "mastercard", "other"]).nullable().optional(),
  issuer: z
    .object({
      id: Id.optional(),
      name: z.string(),
      country: Country.nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
  cardTypes: z
    .object({
      physical: z.boolean().nullable().optional(),
      virtual: z.boolean().nullable().optional(),
    })
    .strict()
    .describe("Supported card formats, regardless of a temporary ordering/issuance pause. A pause does not mean physical=false or virtual=false; omit unknown format support.")
    .nullable()
    .optional(),
  iban: z
    .object({
      supported: z.boolean(),
      type: z.enum(["personal", "pooled", "other"]).nullable().optional(),
    })
    .strict()
    .nullable()
    .optional(),
  kyc: z.boolean().nullable().optional(),
  custodial: z.boolean().nullable().optional(),
  residentCountries: z.array(Country).nullable().optional(),
  excludedResidentCountries: z.array(Country).nullable().optional(),
  regions: z.array(z.string()).nullable().optional(),
  currencies: z.array(Currency).nullable().optional(),
  cryptoAssets: z.array(z.string()).nullable().optional(),
  chains: z.array(z.string()).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  terms: z.array(z.string()).nullable().optional(),
  fees: z.array(FeeRule).optional(),
  rewards: z.array(RewardRule).optional(),
  limits: z.array(LimitRule).optional(),
};
export const Features = z.object(FeatureShape).strict();
const Metadata = {
  inheritFields: z
    .array(
      z.enum(
        Object.keys(FeatureShape) as [
          keyof typeof FeatureShape,
          ...(keyof typeof FeatureShape)[],
        ],
      ),
    )
    .optional(),
  fieldSources: z.record(Origins).optional(),
  unconfirmedFields: z.array(z.string()).optional(),
};
const Identity = {
  defillamaSlug: z.string().optional(),
  id: Id,
  name: z.string().min(1),
  lifecycle: z.enum(["active", "deprecated", "retired"]).optional(),
  retiredAt: z.string().nullable().optional(),
};
export const Tier = z
  .object({
    ...Identity,
    legacyRegion: z.string().optional(),
    ...Metadata,
    ...FeatureShape,
  })
  .strict();
export const Product = z
  .object({
    ...Identity,
    ...Metadata,
    ...FeatureShape,
    tiers: z.array(Tier).optional(),
  })
  .strict();
export const Card = z
  .object({
    id: Id,
    name: z.string().min(1),
    website: z.string().url(),
    ...Metadata,
    ...FeatureShape,
    products: z.array(Product).optional(),
  })
  .strict();
export type CardData = z.infer<typeof Card>;
export type FeaturesData = z.infer<typeof Features>;
export type EvidenceData = z.infer<typeof Evidence>;
export type ScopeData = z.infer<typeof Scope>;
export type FeeData = z.infer<typeof FeeRule>;
export type ProductData = z.infer<typeof Product>;
export type TierData = z.infer<typeof Tier>;
const Hint = z.object(Identity).strict();
export const Config = z
  .object({
    id: Id,
    name: z.string().min(1),
    website: z.string().url(),
    discovery: z.boolean().default(false),
    products: z.array(Hint).default([]),
    tiers: z
      .array(
        z
          .object({
            ...Identity,
            productId: Id,
            legacyRegion: z.string().optional(),
          })
          .strict(),
      )
      .default([]),
    aliases: z.record(z.string(), Id).default({}),
  })
  .strict();
export type CardConfig = z.input<typeof Config>;
export const Sources = z
  .object({
    urls: z.array(z.string().url()).min(1),
    allowedDomains: z.array(z.string().regex(/^[a-z0-9.-]+$/)).min(1),
    metadata: z
      .array(
        z
          .object({
            url: z.string().url(),
            productIds: z.array(Id),
            kind: z.string().optional(),
            scope: z.union([z.string(), z.array(z.string())]).optional(),
            topics: z.array(z.string()).optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
export type CardSources = z.infer<typeof Sources>;
export const Static = z
  .object({
    ...FeatureShape,
    ...Metadata,
    products: z.array(Product).optional(),
    note: z.string().optional(),
    sourceDate: z.string().optional(),
  })
  .strict();
export type CardStaticData = z.infer<typeof Static>;
export interface Adapter {
  config: z.output<typeof Config>;
  sources: CardSources;
  static: CardStaticData;
}

// Each claim has one typed value and an independently verifiable citation. Null means unknown.
const Target = {
  inherit: z.boolean().default(false),
  productId: Id.nullable(),
  tierId: Id.nullable(),
  evidence: Evidence,
};
const factVariants = Object.entries(FeatureShape).map(([field, value]) =>
  z.object({ ...Target, field: z.literal(field), value }).strict(),
);
export const Fact = z.union(
  factVariants as [
    (typeof factVariants)[number],
    (typeof factVariants)[number],
    ...(typeof factVariants)[number][],
  ],
);
export const Extraction = z
  .object({
    complete: z.boolean(),
    products: z.array(Hint),
    tiers: z.array(z.object({ ...Identity, productId: Id }).strict()),
    facts: z.array(Fact),
  })
  .strict();
export type ExtractionData = z.infer<typeof Extraction>;
export interface Block {
  id: string;
  text: string;
}
export interface Document {
  url: string;
  title: string;
  content: string;
  hash: string;
  blocks: Block[];
  links: string[];
  status: "ok" | "unavailable" | "pending_transcription";
  error?: string;
}
