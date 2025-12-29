export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose"; // Add this import

export async function GET(req: Request) {
  try {
    // Get auth from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId (optional - just for validation)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    console.log(`📊 Fetching admin stats for user ${userId}`);

    const [
      totalUsers,
      totalPharmacies,
      totalRiders,
      totalOrders,
      pendingPharmacies,
      pendingRiders,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.pharmacy.count(),
      prisma.rider.count(),
      prisma.order.count(),
      prisma.pharmacy.count({ where: { verified: false } }),
      prisma.rider.count({ where: { verified: false } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { total: true },
      }),
    ]);

    const stats = {
      totalUsers,
      totalPharmacies,
      totalRiders,
      totalOrders,
      pendingPharmacies,
      pendingRiders,
      totalRevenue: totalRevenue._sum.total || 0,
    };

    console.log("✅ Admin stats:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
