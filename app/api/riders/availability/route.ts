// app/api/riders/availability/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
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

    // Get the new availability status from request body
    const body = await req.json();
    const { availability } = body;

    // Valid availability statuses
    const validStatuses = ["AVAILABLE", "BUSY", "OFFLINE"];

    if (!validStatuses.includes(availability)) {
      return NextResponse.json(
        { error: "Invalid availability status" },
        { status: 400 }
      );
    }

    // Get rider
    const rider = await prisma.rider.findUnique({
      where: { userId: userId },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    // Check if rider has active deliveries
    if (availability === "OFFLINE") {
      const activeOrders = await prisma.order.count({
        where: {
          riderId: rider.id,
          status: {
            in: ["READY", "PICKED"],
          },
        },
      });

      if (activeOrders > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot go offline while you have active deliveries. Please complete them first.",
          },
          { status: 400 }
        );
      }
    }

    // Update rider availability
    const updatedRider = await prisma.rider.update({
      where: { id: rider.id },
      data: { availability },
    });

    console.log(`✅ Rider ${rider.id} availability updated to ${availability}`);

    return NextResponse.json({
      success: true,
      availability: updatedRider.availability,
    });
  } catch (error) {
    console.error("❌ Error updating rider availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
