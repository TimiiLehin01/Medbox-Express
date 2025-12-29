// app/api/pharmacies/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        products: {
          where: {
            quantity: { gt: 0 },
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    if (!pharmacy) {
      return NextResponse.json(
        { error: "Pharmacy not found" },
        { status: 404 }
      );
    }

    const avgRating =
      pharmacy.reviews.length > 0
        ? pharmacy.reviews.reduce((sum, r) => sum + r.rating, 0) /
          pharmacy.reviews.length
        : 0;

    return NextResponse.json({
      ...pharmacy,
      averageRating: avgRating,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch pharmacy" },
      { status: 500 }
    );
  }
}
