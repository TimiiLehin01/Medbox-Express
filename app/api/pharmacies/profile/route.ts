// app/api/pharmacies/profile/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose"; // Add this import

export async function GET(req: NextRequest) {
  try {
    // Get logged-in user from cookies
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

    // Fetch pharmacy profile with products
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        products: true, // Include all product details
      },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    console.log("✅ Pharmacy profile fetched:", {
      id: pharmacy.id,
      userId: userId,
      name: pharmacy.name,
      verified: pharmacy.verified,
      productsCount: pharmacy.products?.length || 0,
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error("❌ Error fetching pharmacy profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacy profile" },
      { status: 500 }
    );
  }
}
