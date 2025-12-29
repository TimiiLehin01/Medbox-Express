// app/api/admin/riders/approve/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user-role")?.value;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { riderId } = await req.json();

    if (!riderId) {
      return NextResponse.json({ error: "Rider ID required" }, { status: 400 });
    }

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        verified: true,
        availability: "AVAILABLE",
        user: {
          update: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rider approved successfully",
      rider,
    });
  } catch (error) {
    console.error("Error approving rider:", error);
    return NextResponse.json(
      { error: "Failed to approve rider" },
      { status: 500 }
    );
  }
}
