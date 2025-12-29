// app/api/admin/riders/reject/route.ts
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

    const { riderId, reason } = await req.json();

    if (!riderId || !reason) {
      return NextResponse.json(
        { error: "Rider ID and reason required" },
        { status: 400 }
      );
    }

    const rider = await prisma.rider.update({
      where: { id: riderId },
      data: {
        user: {
          update: {
            status: "BLOCKED",
          },
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rider rejected",
      rider,
    });
  } catch (error) {
    console.error("Error rejecting rider:", error);
    return NextResponse.json(
      { error: "Failed to reject rider" },
      { status: 500 }
    );
  }
}
