export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CONSUMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { paymentReference: reference, consumerId: session.userId },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (orders.every((o) => o.paymentStatus === "PAID")) {
      return NextResponse.json({ status: "success" });
    }

    const tx = await verifyTransaction(reference);
    const expectedKobo = Math.round(
      orders.reduce((sum, o) => sum + o.total, 0) * 100,
    );

    if (
      tx.status === "success" &&
      tx.amount === expectedKobo &&
      tx.currency === "NGN"
    ) {
      await prisma.order.updateMany({
        where: { paymentReference: reference, consumerId: session.userId },
        data: { paymentStatus: "PAID" },
      });
      return NextResponse.json({ status: "success" });
    }

    if (tx.status === "failed") {
      await prisma.order.updateMany({
        where: { paymentReference: reference, consumerId: session.userId },
        data: { paymentStatus: "FAILED" },
      });
    }

    return NextResponse.json({ status: tx.status });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json(
      { error: "Could not verify payment" },
      { status: 500 },
    );
  }
}
