import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "./lib/auth";
export async function proxy(request: NextRequest) {
  if (await authorize(request.headers)) return NextResponse.next();
  return new NextResponse("Administrator authorization required", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      ...(process.env.ADMIN_AUTH_MODE === "basic"
        ? {
            "WWW-Authenticate":
              'Basic realm="Crypto Cards Admin", charset="UTF-8"',
          }
        : {}),
    },
  });
}
export const config = {
  matcher: [
    "/((?!api/cache/|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
