import { afterEach, it, expect, vi } from "vitest";
import { authorize } from "../apps/admin/lib/auth";
afterEach(() => vi.unstubAllEnvs());
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
