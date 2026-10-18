import { cacheResponse } from "../../../../../lib/public-cache";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return cacheResponse(request, `cards/${(await params).id}`);
}
