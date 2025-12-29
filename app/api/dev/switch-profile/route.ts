// app/api/dev/switch-profile/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; // ⚠️ UPDATE THIS to your prisma import path
import { SignJWT } from "jose"; // ⚠️ Or use your JWT library

export async function POST(request: Request) {
  // Allow in development OR if demo mode is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !isDemoMode) {
    return NextResponse.json(
      { error: "Demo mode not enabled" },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `User with email ${email} not found. Please create this account first.`,
        },
        { status: 404 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // Set both cookies
    const cookieStore = await cookies();

    // Cookie 1: auth-token
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Cookie 2: user-role
    cookieStore.set("user-role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile switch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
