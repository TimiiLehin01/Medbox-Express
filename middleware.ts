import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Get the token from cookies (we'll set this after login)
  const token = req.cookies.get("auth-token")?.value;
  const userRole = req.cookies.get("user-role")?.value;

  // Public paths that don't need authentication
  const isPublicPath =
    path === "/" ||
    path.startsWith("/auth/signin") ||
    path.startsWith("/auth/signup") ||
    path === "/unauthorized";

  // If accessing protected route without token, redirect to signin
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Role-based access control
  if (token && userRole) {
    if (path.startsWith("/consumer") && userRole !== "CONSUMER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/pharmacy") && userRole !== "PHARMACY") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/rider") && userRole !== "RIDER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/consumer/:path*",
    "/pharmacy/:path*",
    "/rider/:path*",
    "/admin/:path*",
  ],
};
