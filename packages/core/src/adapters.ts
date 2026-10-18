import { readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Config, Sources, Static, type Adapter } from "./schema";
export function adapterDirectory() {
  if (process.env.ADAPTERS_DIR) return resolve(process.env.ADAPTERS_DIR);
  let directory = process.cwd();
  while (true) {
    if (existsSync(resolve(directory, "pnpm-workspace.yaml")))
      return resolve(directory, "packages/adapters");
    const parent = dirname(directory);
    if (parent === directory)
      throw new Error("Cannot find workspace root; set ADAPTERS_DIR");
    directory = parent;
  }
}
export async function loadAdapters(
  directory = adapterDirectory(),
): Promise<Adapter[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const out: Adapter[] = [];
  for (const dir of entries
    .filter(
      (x) =>
        x.isDirectory() && x.name !== "node_modules" && !x.name.startsWith("."),
    )
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const files = (await readdir(resolve(directory, dir.name)))
      .filter((x) => x.endsWith(".ts"))
      .sort();
    if (files.join(",") !== "config.ts,sources.ts,static.ts")
      throw new Error(
        `${dir.name}: expected exactly config.ts, sources.ts, static.ts`,
      );
    const values: Record<string, unknown> = {};
    for (const [file, schema] of [
      ["config", Config],
      ["sources", Sources],
      ["static", Static],
    ] as const) {
      const mod = await import(
        /* webpackIgnore: true */ pathToFileURL(
          resolve(directory, dir.name, `${file}.ts`),
        ).href
      );
      const parsed = schema.safeParse(mod.default);
      if (!parsed.success)
        throw new Error(
          `${dir.name}/${file}.ts: ${parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`,
        );
      values[file] = parsed.data;
    }
    const a = values as unknown as Adapter;
    if (a.config.id !== dir.name)
      throw new Error(`${dir.name}/config.ts: id must match directory`);
    for (const url of a.sources.urls) {
      const u = new URL(url);
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        !a.sources.allowedDomains.includes(u.hostname)
      )
        throw new Error(`${dir.name}/sources.ts: untrusted URL ${url}`);
    }
    const products = new Set(a.config.products.map((x) => x.id));
    const tiers = new Set<string>();
    for (const t of a.config.tiers) {
      if (!products.has(t.productId) || tiers.has(t.id))
        throw new Error(
          `${dir.name}/config.ts: duplicate tier or unknown product: ${t.id}`,
        );
      tiers.add(t.id);
    }
    for (const target of Object.values(a.config.aliases))
      if (!products.has(target) && !tiers.has(target))
        throw new Error(
          `${dir.name}/config.ts: alias target ${target} is unknown`,
        );
    out.push(a);
  }
  return out;
}
