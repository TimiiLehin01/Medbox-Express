// app/api/products/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose"; // ✅ Add this import

// GET all products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};

    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            verified: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value; // ✅ Changed to token
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "PHARMACY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    console.log("🔍 Creating product for userId:", userId); // Debug log

    // Find pharmacy profile
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
    });

    console.log("🔍 Pharmacy found:", pharmacy); // Debug log

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Create product
    const product = await prisma.product.create({
      data: {
        pharmacyId: pharmacy.id,
        name: body.name,
        description: body.description,
        category: body.category,
        price: parseFloat(body.price),
        quantity: parseInt(body.quantity),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        prescriptionRequired: body.prescriptionRequired || false,
        imageUrl: body.imageUrl || "",
      },
    });

    console.log("✅ Product created:", product.id);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("❌ Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
