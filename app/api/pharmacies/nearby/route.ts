// app/api/pharmacies/nearby/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch ALL pharmacies (verified and unverified)
    const pharmacies = await prisma.pharmacy.findMany({
      include: {
        user: {
          select: {
            phone: true,
          },
        },
        products: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error("Error fetching nearby pharmacies:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 }
    );
  }
}
