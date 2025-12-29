import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().nonnegative(),
  expiryDate: z.string().optional(),
  prescriptionRequired: z.boolean(),
  imageUrl: z.string().optional(),
});

// GET all products or search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const pharmacyId = searchParams.get("pharmacyId");

    const where: any = {
      quantity: { gt: 0 },
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            verified: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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

// POST create product (pharmacy only)
export async function POST(req: Request) {
  try {
    // Get auth from cookies instead of NextAuth
    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "PHARMACY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = productSchema.parse(body);

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy profile not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        pharmacyId: pharmacy.id,
        expiryDate: validatedData.expiryDate
          ? new Date(validatedData.expiryDate)
          : null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
