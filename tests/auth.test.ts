import { afterEach, it, expect, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { authorize } from "../apps/admin/lib/auth";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("fails closed when admin authorization is not configured", async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "cloudflare");
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", "");
  expect(await authorize(new Headers())).toBeNull();
});
it("verifies standard Basic credentials and requires a strong configured password", async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "basic");
  vi.stubEnv("ADMIN_USER", "admin");
  vi.stubEnv("ADMIN_PASSWORD", "fixture-password-at-least-16");
  const headers = (text: string) =>
    new Headers({
      authorization: `Basic ${Buffer.from(text).toString("base64")}`,
    });
  expect(await authorize(headers("admin:fixture-password-at-least-16"))).toBe(
    "admin",
  );
  expect(await authorize(headers("admin:wrong"))).toBeNull();
  expect(await authorize(new Headers())).toBeNull();
  vi.stubEnv("ADMIN_PASSWORD", "weak");
  expect(await authorize(headers("admin:weak"))).toBeNull();
});
it("does not trust forged Cloudflare email headers or unsigned assertions", async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "cloudflare");
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", "fixture.cloudflareaccess.com");
  vi.stubEnv("CF_ACCESS_AUD", "fixture");
  vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
  expect(
    await authorize(
      new Headers({
        "cf-access-authenticated-user-email": "admin@example.com",
      }),
    ),
  ).toBeNull();
  expect(
    await authorize(new Headers({ "cf-access-jwt-assertion": "forged" })),
  ).toBeNull();
});
it("verifies signed Access JWTs and rejects expired, wrong-audience and unlisted identities", async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "cloudflare");
  vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", "fixture.cloudflareaccess.com");
  vi.stubEnv("CF_ACCESS_AUD", "fixture");
  vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "test-key", alg: "RS256", use: "sig" };
  const fetchKeys = vi.fn(async (url: string | URL | Request) => {
    expect(String(url)).toBe("https://fixture.cloudflareaccess.com/cdn-cgi/access/certs");
    return Response.json({ keys: [jwk] });
  });
  vi.stubGlobal("fetch", fetchKeys);
  const now = Math.floor(Date.now() / 1000);
  const assertion = (patch: Record<string, unknown> = {}) => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "test-key" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: "https://fixture.cloudflareaccess.com", aud: "fixture",
      email: "admin@example.com", iat: now, exp: now + 300, ...patch,
    })).toString("base64url");
    const content = `${header}.${payload}`;
    return new Headers({ "cf-access-jwt-assertion": `${content}.${sign("RSA-SHA256", Buffer.from(content), privateKey).toString("base64url")}` });
  };
  expect(await authorize(assertion())).toBe("admin@example.com");
  expect(await authorize(assertion({ exp: now - 60 }))).toBeNull();
  expect(await authorize(assertion({ aud: "another-app" }))).toBeNull();
  expect(await authorize(assertion({ iss: "https://another.cloudflareaccess.com" }))).toBeNull();
  expect(await authorize(assertion({ email: "outsider@example.com" }))).toBeNull();
  const forged = assertion();
  const token = forged.get("cf-access-jwt-assertion")!;
  const parts = token.split(".");
  parts[2] = Buffer.alloc(256).toString("base64url");
  forged.set("cf-access-jwt-assertion", parts.join("."));
  expect(await authorize(forged)).toBeNull();
  expect(fetchKeys).toHaveBeenCalledTimes(1);
});
