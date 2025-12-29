// app/api/orders/[id]/accept/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    // Get auth from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get the actual userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    console.log("🔍 Looking for rider with userId:", userId);

    const rider = await prisma.rider.findUnique({
      where: { userId: userId },
    });

    if (!rider) {
      console.log("❌ Rider not found for userId:", userId);
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    console.log("✅ Rider found:", rider.id);

    // Check if order is still available
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.riderId) {
      return NextResponse.json(
        { error: "Order already assigned to another rider" },
        { status: 400 }
      );
    }

    if (order.status !== "READY") {
      return NextResponse.json(
        { error: "Order is not ready for pickup" },
        { status: 400 }
      );
    }

    // Assign order to rider
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        riderId: rider.id,
      },
    });

    // Update rider availability
    await prisma.rider.update({
      where: { id: rider.id },
      data: {
        availability: "BUSY",
      },
    });

    console.log("✅ Order assigned to rider successfully");

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ Accept order error:", error);
    return NextResponse.json(
      { error: "Failed to accept order" },
      { status: 500 }
    );
  }
}
