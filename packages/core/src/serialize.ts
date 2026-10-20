import { createHash } from "node:crypto";
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
    .join(",")}}`;
}
export const hash = (v: unknown) =>
  createHash("sha256")
    .update(typeof v === "string" ? v : canonical(v))
    .digest("hex");
export const slug = (v: string) =>
  v
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unnamed";
export function compareDecimals(a: string, b: string) {
  const [ai, af = ""] = a.split("."),
    [bi, bf = ""] = b.split(".");
  return (
    ai.length - bi.length ||
    ai.localeCompare(bi) ||
    af
      .padEnd(Math.max(af.length, bf.length), "0")
      .localeCompare(bf.padEnd(Math.max(af.length, bf.length), "0"))
  );
}
