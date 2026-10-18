import { cacheResponse } from "../../../../lib/public-cache";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return cacheResponse(request, "cards");
}
