// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; // Add this import

export async function GET(req: NextRequest) {
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

    let orders = [];

    if (userRole === "PHARMACY") {
      // Get pharmacy's orders
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { userId: userId },
      });

      if (!pharmacy) {
        return NextResponse.json(
          { error: "Pharmacy not found" },
          { status: 404 }
        );
      }

      orders = await prisma.order.findMany({
        where: { pharmacyId: pharmacy.id },
        include: {
          consumer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userRole === "CONSUMER") {
      // Get consumer's orders
      orders = await prisma.order.findMany({
        where: { consumerId: userId },
        include: {
          pharmacy: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userRole === "RIDER") {
      // Get rider's orders
      const rider = await prisma.rider.findUnique({
        where: { userId: userId },
      });

      if (rider) {
        orders = await prisma.order.findMany({
          where: { riderId: rider.id },
          include: {
            pharmacy: true,
            consumer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    console.log(
      `✅ Fetched ${orders.length} orders for ${userRole} (userId: ${userId})`
    );
    return NextResponse.json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "CONSUMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const {
      pharmacyId,
      items,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      paymentMethod,
      notes,
      prescriptionUrl,
      subtotal,
      deliveryFee,
      total,
    } = body;

    // Create the order
    const order = await prisma.order.create({
      data: {
        consumerId: userId,
        pharmacyId,
        deliveryAddress,
        deliveryLatitude,
        deliveryLongitude,
        paymentMethod,
        notes,
        prescriptionUrl,
        subtotal,
        deliveryFee,
        total,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Created order ${order.id}`);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
