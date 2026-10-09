export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !isDemoMode) {
    return NextResponse.json(
      { error: "Demo mode not enabled" },
      { status: 403 },
    );
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });

    const profiles = users.map((user) => ({
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      role: user.role,
    }));

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 },
    );
  }
}
