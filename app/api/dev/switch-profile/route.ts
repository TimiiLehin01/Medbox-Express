export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !isDemoMode) {
    return NextResponse.json(
      { error: "Demo mode not enabled" },
      { status: 403 },
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `User with email ${email} not found. Please create this account first.`,
        },
        { status: 404 },
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key",
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

    const cookieStore = await cookies();

    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    cookieStore.set("user-role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
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
      { status: 500 },
    );
  }
}
