// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET single product
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            verified: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "PHARMACY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy profile not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.pharmacyId !== pharmacy.id) {
      return NextResponse.json(
        { error: "You can only delete your own products" },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

// UPDATE product
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "PHARMACY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: userId },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy profile not found" },
        { status: 404 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (existingProduct.pharmacyId !== pharmacy.id) {
      return NextResponse.json(
        { error: "You can only update your own products" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        quantity: body.quantity,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        prescriptionRequired: body.prescriptionRequired,
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
