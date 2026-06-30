import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    const auth =
      request.headers.get("authorization");

    if (!auth) {
      return new Response("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate":
            'Basic realm="ASFP Admin"',
        },
      });
    }

    const encoded = auth.split(" ")[1];

    const [user, pass] = atob(encoded).split(":");

    if (
      user !== "admin" ||
      pass !== "asfp2026"
    ) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate":
            'Basic realm="ASFP Admin"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};