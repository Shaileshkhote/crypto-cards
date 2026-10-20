import { createRemoteJWKSet, jwtVerify } from "jose";
import { timingSafeEqual, createHash } from "node:crypto";
let keys: ReturnType<typeof createRemoteJWKSet> | undefined;
const digest = (s: string) => createHash("sha256").update(s).digest();
export async function authorize(headers: Headers): Promise<string | null> {
  if (process.env.ADMIN_AUTH_MODE === "basic") {
    const user = process.env.ADMIN_USER,
      password = process.env.ADMIN_PASSWORD;
    if (!user || !password || password.length < 16) return null;
    const value = headers.get("authorization") || "";
    if (!value.startsWith("Basic ")) return null;
    const credentials = Buffer.from(value.slice(6), "base64").toString();
    return timingSafeEqual(digest(credentials), digest(`${user}:${password}`))
      ? user
      : null;
  }
  const team = process.env.CF_ACCESS_TEAM_DOMAIN,
    aud = process.env.CF_ACCESS_AUD,
    emails = process.env.ADMIN_EMAILS?.split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  if (
    !team ||
    !aud ||
    !emails?.length ||
    !/^[-a-z0-9]+\.cloudflareaccess\.com$/.test(team)
  )
    return null;
  const token = headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  try {
    keys ??= createRemoteJWKSet(
      new URL(`https://${team}/cdn-cgi/access/certs`),
    );
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://${team}`,
      audience: aud,
      algorithms: ["RS256"],
    });
    const email =
      typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    return emails.includes(email) ? email : null;
  } catch {
    return null;
  }
}
