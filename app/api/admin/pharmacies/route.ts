export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getVerifiedRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userRole = (await getVerifiedRole());

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacies = await prisma.pharmacy.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error("Fetch pharmacies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 },
    );
  }
}
