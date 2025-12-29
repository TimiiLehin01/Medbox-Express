// app/api/orders/[id]/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// GET single order
export async function GET(
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

    // Await params in Next.js 15
    const params = await context.params;
    const orderId = params.id;

    console.log(
      `🔍 Fetching order ${orderId} for user ${userId} (${userRole})`
    );

    // Fetch the order with all relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        consumer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            user: {
              // ← FIXED: Access phone through user relation
              select: {
                phone: true,
              },
            },
          },
        },
        rider: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.log(`❌ Order ${orderId} not found in database`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(
      `📦 Order found - consumerId: ${order.consumerId}, checking authorization...`
    );

    // Authorization check based on role
    let authorized = false;

    if (userRole === "CONSUMER") {
      authorized = order.consumerId === userId;
      console.log(
        `Consumer check: ${order.consumerId} === ${userId} = ${authorized}`
      );
    } else if (userRole === "PHARMACY") {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: userId },
      });
      authorized = pharmacy?.id === order.pharmacyId;
      console.log(
        `Pharmacy check: ${pharmacy?.id} === ${order.pharmacyId} = ${authorized}`
      );
    } else if (userRole === "RIDER") {
      const rider = await prisma.rider.findUnique({
        where: { userId: userId },
      });
      authorized = rider?.id === order.riderId;
      console.log(
        `Rider check: ${rider?.id} === ${order.riderId} = ${authorized}`
      );
    } else if (userRole === "ADMIN") {
      authorized = true;
      console.log(`Admin - authorized by default`);
    }

    if (!authorized) {
      console.log(`❌ User not authorized to view order ${orderId}`);
      return NextResponse.json(
        { error: "Not authorized to view this order" },
        { status: 403 }
      );
    }

    console.log(
      `✅ Fetched order ${orderId} for ${userRole} (userId: ${userId})`
    );
    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
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

    // Await params in Next.js 15
    const params = await context.params;
    const orderId = params.id;

    const body = await req.json();
    const { status } = body;

    // Get the order first to check authorization
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user is authorized to update this order
    let authorized = false;

    if (userRole === "PHARMACY") {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: userId },
      });
      authorized = pharmacy?.id === order.pharmacyId;
    } else if (userRole === "RIDER") {
      const rider = await prisma.rider.findUnique({
        where: { userId: userId },
      });
      authorized = rider?.id === order.riderId;
    } else if (userRole === "ADMIN") {
      authorized = true;
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Not authorized to update this order" },
        { status: 403 }
      );
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        consumer: true,
        pharmacy: true,
        rider: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Updated order ${orderId} status to ${status}`);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
