// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Await params
    const params = await context.params;
    const orderId = params.id;

    // Get the request body
    const body = await req.json();
    const { status } = body;

    console.log(`📦 Updating order ${orderId} to status: ${status}`);

    // Valid status transitions
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

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization check based on role and status change
    let authorized = false;
    let riderId = null;

    if (userRole === "PHARMACY") {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: userId },
      });

      // Pharmacy can only update their own orders to ACCEPTED, READY, CANCELLED
      authorized =
        pharmacy?.id === order.pharmacyId &&
        ["ACCEPTED", "READY", "CANCELLED"].includes(status);
    } else if (userRole === "RIDER") {
      const rider = await prisma.rider.findUnique({
        where: { userId: userId },
      });

      riderId = rider?.id;

      // Rider can only update orders assigned to them to PICKED, DELIVERED
      authorized =
        rider?.id === order.riderId && ["PICKED", "DELIVERED"].includes(status);
    } else if (userRole === "ADMIN") {
      authorized = true;
    }

    if (!authorized) {
      console.log(`❌ User not authorized to update order status`);
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // If order is marked as DELIVERED by rider
    if (status === "DELIVERED" && userRole === "RIDER" && riderId) {
      console.log(`💰 Creating rider earning for order ${orderId}`);

      // Create rider earning record
      await prisma.riderEarning.create({
        data: {
          riderId: riderId,
          amount: order.deliveryFee,
          description: `Delivery fee for Order #${order.id.slice(0, 8)}`,
        },
      });

      // Update rider availability to AVAILABLE
      await prisma.rider.update({
        where: { id: riderId },
        data: { availability: "AVAILABLE" },
      });

      console.log(`✅ Rider earning recorded: ₦${order.deliveryFee}`);
      console.log(`✅ Rider status updated to AVAILABLE`);
    }

    console.log(`✅ Order ${orderId} status updated to ${status}`);

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
