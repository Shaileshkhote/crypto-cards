import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { db, closeDb } from "./index";
export async function migrate() {
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('migrations',0))",
    );
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
    for (const name of (await readdir(dir))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      if (
        (await c.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name]))
          .rowCount
      )
        continue;
      await c.query(await readFile(`${dir}/${name}`, "utf8"));
      await c.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
      console.log(`Applied ${name}`);
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  migrate()
    .then(closeDb)
    .catch(async (e) => {
      console.error(e.message);
      await closeDb();
      process.exitCode = 1;
    });
