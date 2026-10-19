import pg from "pg";
export type Connection = Pick<pg.PoolClient, "query">;
export type CardRow = {
  id: string;
  retired: boolean;
  data: unknown;
  version: number;
  publication_hash: string;
  updated_at: Date;
};
export type ReviewRow = {
  id: string;
  card_id: string;
  base_version: number;
  changes: unknown;
  context: unknown;
  status: string;
  reviewer: string | null;
  created_at: Date;
};
export type JobRow = {
  id: string;
  kind: "sync" | "cache";
  card_id: string | null;
  force: boolean;
  status: string;
  progress: Record<string, unknown>;
  cost_usd: string;
  error: string | null;
  created_at: Date;
};
let instance: pg.Pool | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required; see .env.example");
  return (instance ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 10_000,
  }));
}
export async function closeDb() {
  await instance?.end();
  instance = undefined;
}
export async function transaction<T>(
  work: (c: Connection) => Promise<T>,
): Promise<T> {
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    const result = await work(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function withLock<T>(
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  const c = await db().connect();
  try {
    const { rows } = await c.query(
      "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked",
      [key],
    );
    if (!rows[0].locked) throw new Error(`Already running: ${key}`);
    try {
      return await work();
    } finally {
      await c.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [key]);
    }
  } finally {
    c.release();
  }
}
export async function publish(
  c: Connection,
  id: string,
  data: unknown,
  publicationHash: string,
  baseVersion: number,
) {
  const { rows } = await c.query<CardRow>(
    "SELECT * FROM cards WHERE id=$1 FOR UPDATE",
    [id],
  );
  if ((rows[0]?.version ?? 0) !== baseVersion)
    throw new Error("Published version changed; refresh review");
  if (rows[0]?.retired) throw new Error(`Adapter is retired: ${id}`);
  if (rows[0]?.publication_hash === publicationHash) return baseVersion;
  const version = baseVersion + 1;
  await c.query(
    "INSERT INTO cards(id,data,version,publication_hash) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,version=EXCLUDED.version,publication_hash=EXCLUDED.publication_hash,updated_at=now()",
    [id, JSON.stringify(data), version, publicationHash],
  );
  await c.query(
    "INSERT INTO card_versions(card_id,version,data,publication_hash) VALUES($1,$2,$3,$4)",
    [id, version, JSON.stringify(data), publicationHash],
  );
  return version;
}
export async function listPublishedCards() {
  return (await db().query<CardRow>("SELECT * FROM cards WHERE NOT retired ORDER BY id")).rows;
}
export async function getPublishedCard(id: string) {
  return (await db().query<CardRow>("SELECT * FROM cards WHERE id=$1 AND NOT retired", [id]))
    .rows[0];
}
export async function listCardSources(id: string) {
  return (
    await db().query<{
      url: string;
      fetch_status: string;
      error: string | null;
    }>(
      "SELECT url,fetch_status,error FROM card_sources WHERE card_id=$1 ORDER BY url",
      [id],
    )
  ).rows;
}
export async function databaseReady() {
  await db().query("SELECT 1 FROM cards LIMIT 1");
}
