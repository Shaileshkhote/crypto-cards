import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";

// Reusable local cloud database, separate from the disposable integration database.
// Never output credentials, reset a database, or replace an existing local binding.
const directory = new URL("../.local/", import.meta.url);
const binding = new URL("dev.env", directory);
const name = "crypto-cards-dev-pg",
  volume = "crypto-cards-dev-data";
function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Docker ${args[0]} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}
await mkdir(directory, { recursive: true });
try {
  await access(binding);
} catch {
  const old = spawnSync("docker", ["volume", "inspect", volume], {
    stdio: "ignore",
  });
  if (old.status === 0)
    throw new Error(
      "Existing dev database volume has no local credential binding. Restore .local/dev.env rather than generating a different password.",
    );
  const password = randomBytes(24).toString("hex"),
    adminPassword = randomBytes(24).toString("hex");
  await writeFile(
    binding,
    `POSTGRES_USER=postgres\nPOSTGRES_DB=cards_dev\nPOSTGRES_PASSWORD=${password}\nDATABASE_URL=postgresql://postgres:${password}@127.0.0.1:55433/cards_dev\nADMIN_AUTH_MODE=basic\nADMIN_USER=admin\nADMIN_PASSWORD=${adminPassword}\n`,
    { mode: 0o600, flag: "wx" },
  );
}
const existing = spawnSync("docker", ["container", "inspect", name], {
  stdio: "ignore",
});
if (existing.status !== 0)
  docker([
    "create",
    "--name",
    name,
    "--env-file",
    binding.pathname,
    "--mount",
    `type=volume,src=${volume},dst=/var/lib/postgresql/data`,
    "-p",
    "127.0.0.1:55433:5432",
    "postgres:17",
  ]);
docker(["start", name]);
let ready = false;
for (let i = 0; i < 30; i++) {
  const check = spawnSync(
    "docker",
    ["exec", name, "pg_isready", "-U", "postgres", "-d", "cards_dev"],
    { stdio: "ignore" },
  );
  if (check.status === 0) {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) throw new Error("Development PostgreSQL did not become ready");
const bindings = parseEnv(await readFile(binding, "utf8"));
const migration = spawnSync("pnpm", ["db:migrate"], {
  env: { ...process.env, ...bindings },
  stdio: "inherit",
});
if (migration.status !== 0) process.exitCode = migration.status || 1;
else
  console.log(
    "Development PostgreSQL is ready. Local credentials are in ignored .local/dev.env; load it with node --env-file=.local/dev.env.",
  );
