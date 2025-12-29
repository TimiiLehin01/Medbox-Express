// app/api/pharmacies/earnings/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "PHARMACY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Get pharmacy info
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    // Get all completed orders
    const completedOrders = await prisma.order.findMany({
      where: {
        pharmacyId: pharmacy.id,
        status: "DELIVERED",
      },
      include: {
        items: true,
      },
    });

    // Calculate total earnings (subtotal from all completed orders)
    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + order.subtotal,
      0
    );

    // Get order counts
    const totalOrders = await prisma.order.count({
      where: { pharmacyId: pharmacy.id },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        pharmacyId: pharmacy.id,
        status: "PENDING",
      },
    });

    const activeOrders = await prisma.order.count({
      where: {
        pharmacyId: pharmacy.id,
        status: {
          in: ["ACCEPTED", "READY", "PICKED"],
        },
      },
    });

    return NextResponse.json({
      totalEarnings,
      totalOrders,
      completedOrders: completedOrders.length,
      pendingOrders,
      activeOrders,
    });
  } catch (error) {
    console.error("Error fetching pharmacy earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
