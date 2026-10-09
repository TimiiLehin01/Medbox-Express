export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";

const DELIVERY_FEE_PER_PHARMACY = 500;

// Pharmacies and riders must not see online orders that have not been paid
const hideUnpaidOnline = {
  NOT: {
    paymentMethod: "online",
    paymentStatus: { not: PaymentStatus.PAID },
  },
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = session;
    let orders: any[] = [];

    if (role === "PHARMACY") {
      const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
      if (!pharmacy) {
        return NextResponse.json(
          { error: "Pharmacy not found" },
          { status: 404 },
        );
      }

      orders = await prisma.order.findMany({
        where: { pharmacyId: pharmacy.id, ...hideUnpaidOnline },
        include: {
          consumer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "CONSUMER") {
      orders = await prisma.order.findMany({
        where: { consumerId: userId },
        include: {
          pharmacy: { select: { id: true, name: true, address: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "RIDER") {
      const rider = await prisma.rider.findUnique({ where: { userId } });

      if (rider) {
        orders = await prisma.order.findMany({
          where: { riderId: rider.id, ...hideUnpaidOnline },
          include: {
            pharmacy: true,
            consumer: { select: { id: true, name: true, phone: true } },
            items: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1),
  deliveryAddress: z.string().min(5),
  deliveryLatitude: z.number().min(-90).max(90),
  deliveryLongitude: z.number().min(-180).max(180),
  paymentMethod: z.enum(["online", "cash"]),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CONSUMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = createOrderSchema.parse(await req.json());

    // Merge duplicate product lines
    const wanted = new Map<string, number>();
    for (const item of data.items) {
      wanted.set(
        item.productId,
        (wanted.get(item.productId) ?? 0) + item.quantity,
      );
    }

    // Prices and pharmacy come from the database, never from the browser
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(wanted.keys()) } },
    });

    if (products.length !== wanted.size) {
      return NextResponse.json(
        { error: "One or more products no longer exist" },
        { status: 400 },
      );
    }

    for (const product of products) {
      const qty = wanted.get(product.id)!;
      if (product.quantity < qty) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.name}` },
          { status: 400 },
        );
      }
    }

    // One order per pharmacy
    const byPharmacy = new Map<string, typeof products>();
    for (const product of products) {
      const list = byPharmacy.get(product.pharmacyId) ?? [];
      list.push(product);
      byPharmacy.set(product.pharmacyId, list);
    }

    const isOnline = data.paymentMethod === "online";
    const reference = isOnline
      ? `MBX-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
      : null;

    let grandTotal = 0;

    const createOps = Array.from(byPharmacy.entries()).map(
      ([pharmacyId, pharmacyProducts]) => {
        const subtotal = pharmacyProducts.reduce(
          (sum, p) => sum + p.price * wanted.get(p.id)!,
          0,
        );
        const deliveryFee = DELIVERY_FEE_PER_PHARMACY;
        const total = subtotal + deliveryFee;
        grandTotal += total;

        return prisma.order.create({
          data: {
            consumerId: session.userId,
            pharmacyId,
            deliveryAddress: data.deliveryAddress,
            deliveryLatitude: data.deliveryLatitude,
            deliveryLongitude: data.deliveryLongitude,
            paymentMethod: data.paymentMethod,
            paymentReference: reference,
            notes: data.notes ?? null,
            subtotal,
            deliveryFee,
            total,
            status: "PENDING",
            paymentStatus: "PENDING",
            items: {
              create: pharmacyProducts.map((p) => ({
                productId: p.id,
                quantity: wanted.get(p.id)!,
                price: p.price,
              })),
            },
          },
        });
      },
    );

    const orders = await prisma.$transaction(createOps);

    if (!isOnline) {
      return NextResponse.json(
        { orderIds: orders.map((o) => o.id) },
        { status: 201 },
      );
    }

    // Online payment: start the Paystack transaction
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      if (!user) throw new Error("User not found");

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const tx = await initializeTransaction({
        email: user.email,
        amountNaira: grandTotal,
        reference: reference!,
        callbackUrl: `${appUrl}/consumer/payment/callback`,
      });

      return NextResponse.json(
        {
          orderIds: orders.map((o) => o.id),
          authorizationUrl: tx.authorization_url,
        },
        { status: 201 },
      );
    } catch (payError) {
      console.error("Could not start payment:", payError);
      // Don't leave unpaid orders behind if payment never started
      await prisma.order.deleteMany({
        where: { paymentReference: reference! },
      });
      return NextResponse.json(
        { error: "Could not start payment. Please try again." },
        { status: 502 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
