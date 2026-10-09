export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/auth";
import {
  DEMO_EMAILS,
  availableDemoRoles,
  isDemoEnabled,
  type DemoRole,
} from "@/lib/demo";

const schema = z.object({
  role: z.enum(["CONSUMER", "PHARMACY", "RIDER", "ADMIN"]),
});

// Tells the signin page which demo buttons to show.
export async function GET() {
  if (!isDemoEnabled()) {
    return NextResponse.json({ enabled: false, roles: [] });
  }
  return NextResponse.json({ enabled: true, roles: availableDemoRoles() });
}

// Signs the visitor in as one of the fixed demo accounts. It can never sign
// in as an arbitrary user, only the four emails listed in lib/demo.ts.
export async function POST(req: Request) {
  if (!isDemoEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { role } = schema.parse(await req.json());

    if (!availableDemoRoles().includes(role as DemoRole)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: DEMO_EMAILS[role as DemoRole] },
    });

    if (!user || user.role !== role || user.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Demo accounts are not set up yet. Run: npm run seed:demo" },
        { status: 404 },
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(getJwtSecret());

    const response = NextResponse.json({
      message: "Signed in to demo account",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24,
    };
    response.cookies.set("auth-token", token, cookieOptions);
    response.cookies.set("user-role", user.role, cookieOptions);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    console.error("Demo signin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
