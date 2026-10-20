import { readCache } from "@cards/core/cache";
export async function cacheResponse(request: Request, key: string) {
  const entry = await readCache(key);
  if (!entry)
    return Response.json(
      { error: "Published cache not found" },
      { status: 404 },
    );
  const etag = `"${entry.content_hash}"`;
  const headers = {
    ETag: etag,
    "Cache-Control":
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };
  if (
    request.headers
      .get("if-none-match")
      ?.split(",")
      .map((x) => x.trim())
      .includes(etag)
  )
    return new Response(null, { status: 304, headers });
  return new Response(entry.payload, { headers });
}
