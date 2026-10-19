import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAdapters } from "@cards/core/adapters";
it("automatically discovers all 36 migrated providers with three files each", async () => {
  const a = await loadAdapters(undefined, { includeRetired: true });
  expect(a).toHaveLength(36);
  expect(a.every((x) => x.config.discovery === false)).toBe(true);
  expect(a.find((x) => x.config.id === "mexc")?.config.products).toHaveLength(
    3,
  );
  expect(a.find((x) => x.config.id === "bitunix")?.config.tiers).toHaveLength(
    9,
  );
}, 20000);
it("excludes retired adapters by default and retains their configuration for validation", async () => {
  const active = await loadAdapters();
  const all = await loadAdapters(undefined, { includeRetired: true });
  expect(active).toHaveLength(33);
  expect(active.some(a => ["safepal", "gnosis-pay", "ready"].includes(a.config.id))).toBe(false);
  expect(all.filter(a => a.config.retired).map(a => a.config.id).sort()).toEqual(["gnosis-pay", "ready", "safepal"]);
});
it("fails with adapter filename and field instead of silently skipping", async () => {
  const root = await mkdtemp(join(tmpdir(), "cards-adapters-"));
  await mkdir(join(root, "broken"));
  for (const file of ["config", "sources", "static"])
    await writeFile(
      join(root, "broken", `${file}.ts`),
      `export default ${file === "config" ? '{id:"Invalid ID"}' : "{}"};`,
    );
  try {
    await expect(loadAdapters(root)).rejects.toThrow(/broken\/config.ts:.*id/);
  } finally {
    await rm(root, { recursive: true });
  }
});
