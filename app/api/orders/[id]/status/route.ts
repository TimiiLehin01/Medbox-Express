export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getJwtSecret, getVerifiedRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = (await getVerifiedRole());

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const params = await context.params;
    const orderId = params.id;

    const body = await req.json();
    const { status } = body;

    console.log(`📦 Updating order ${orderId} to status: ${status}`);

    const validStatuses = [
      "PENDING",
      "ACCEPTED",
      "READY",
      "PICKED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let authorized = false;
    let riderId = null;

    if (userRole === "PHARMACY") {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: userId },
      });

      authorized =
        pharmacy?.id === order.pharmacyId &&
        ["ACCEPTED", "READY", "CANCELLED"].includes(status);
    } else if (userRole === "RIDER") {
      const rider = await prisma.rider.findUnique({
        where: { userId: userId },
      });

      riderId = rider?.id;

      authorized =
        rider?.id === order.riderId && ["PICKED", "DELIVERED"].includes(status);
    } else if (userRole === "ADMIN") {
      authorized = true;
    }

    if (!authorized) {
      console.log(`❌ User not authorized to update order status`);
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (status === "DELIVERED" && userRole === "RIDER" && riderId) {
      console.log(`💰 Creating rider earning for order ${orderId}`);

      await prisma.riderEarning.create({
        data: {
          riderId: riderId,
          amount: order.deliveryFee,
          description: `Delivery fee for Order #${order.id.slice(0, 8)}`,
        },
      });

      await prisma.rider.update({
        where: { id: riderId },
        data: { availability: "AVAILABLE" },
      });

      console.log(` Rider earning recorded: ₦${order.deliveryFee}`);
      console.log(` Rider status updated to AVAILABLE`);
    }

    console.log(` Order ${orderId} status updated to ${status}`);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(" Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
