import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function getRoleFromToken(token: string | undefined) {
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("auth-token")?.value;

  const role = await getRoleFromToken(token);

  // Not logged in, or token is fake/expired
  if (!role) {
    const response = NextResponse.redirect(new URL("/auth/signin", req.url));
    if (token) {
      response.cookies.delete("auth-token");
      response.cookies.delete("user-role");
    }
    return response;
  }

  // Role-based access control
  if (path.startsWith("/consumer") && role !== "CONSUMER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (path.startsWith("/pharmacy") && role !== "PHARMACY") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (path.startsWith("/rider") && role !== "RIDER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
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
