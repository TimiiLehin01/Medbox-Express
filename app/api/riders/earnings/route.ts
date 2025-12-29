// app/api/riders/earnings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
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

    // Get rider info
    const rider = await prisma.rider.findUnique({
      where: { userId: userId },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    // Get all earnings
    const earnings = await prisma.riderEarning.findMany({
      where: { riderId: rider.id },
      orderBy: { date: "desc" },
    });

    // Calculate total earnings
    const totalEarnings = earnings.reduce(
      (sum, earning) => sum + earning.amount,
      0
    );

    // Get delivered orders count
    const deliveredOrders = await prisma.order.count({
      where: {
        riderId: rider.id,
        status: "DELIVERED",
      },
    });

    // Get active orders count
    const activeOrders = await prisma.order.count({
      where: {
        riderId: rider.id,
        status: {
          in: ["READY", "PICKED"],
        },
      },
    });

    return NextResponse.json({
      totalEarnings,
      deliveredOrders,
      activeOrders,
      earnings,
    });
  } catch (error) {
    console.error("Error fetching rider earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
