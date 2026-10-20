// Read-only HTTP smoke checks against an already-running application.
import assert from "node:assert/strict";
const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3100";
const user = process.env.ADMIN_USER,
  password = process.env.ADMIN_PASSWORD;
if (!user || !password)
  throw new Error(
    "Use development Basic admin credentials in the environment for this smoke check",
  );
const headers = {
  Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`,
};
const health = await fetch(`${base}/api/health`);
assert.equal(health.status, 200);
for (const [path, title] of [
  ["/", "Overview"],
  ["/cards", "Cards"],
  ["/runs", "Runs"],
  ["/reviews", "Reviews"],
]) {
  assert.equal((await fetch(base + path)).status, 401, `Anonymous ${path}`);
  const response = await fetch(base + path, { headers });
  assert.equal(response.status, 200, `Authenticated ${path}`);
  assert.ok(
    (await response.text()).includes(`<h1>${title}</h1>`),
    `${path} rendered its screen`,
  );
}
assert.equal(
  (await fetch(base + "/", { method: "POST" })).status,
  401,
  "Anonymous admin writes",
);
assert.equal(
  (await fetch(base + "/api/cache/cards", { method: "POST" })).status,
  405,
  "Public cache is read-only",
);
const cache = await fetch(base + "/api/cache/cards");
assert.equal(cache.status, 200);
assert.ok(Array.isArray(await cache.json()));
const etag = cache.headers.get("etag");
assert.ok(etag);
assert.equal(
  (
    await fetch(base + "/api/cache/cards", {
      headers: { "If-None-Match": etag },
    })
  ).status,
  304,
);
if (process.env.SMOKE_CARD_ID) {
  const id = encodeURIComponent(process.env.SMOKE_CARD_ID);
  assert.equal((await fetch(`${base}/api/cache/cards/${id}`)).status, 200);
  assert.equal((await fetch(`${base}/cards/${id}`, { headers })).status, 200);
}
console.log(
  "HTTP smoke passed: health, four authenticated screens, anonymous write denial, read-only public cache, ETag/304, and optional card details.",
);
