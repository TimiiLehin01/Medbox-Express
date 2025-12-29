// app/api/riders/profile/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; // Add this import

export async function GET(req: NextRequest) {
  try {
    // Get logged-in user from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Fetch rider profile
    const rider = await prisma.rider.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    console.log("✅ Rider profile fetched:", {
      id: rider.id,
      userId: userId,
      name: rider.user.name,
      verified: rider.verified,
      availability: rider.availability,
    });

    return NextResponse.json(rider);
  } catch (error) {
    console.error("❌ Error fetching rider profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch rider profile" },
      { status: 500 }
    );
  }
}
