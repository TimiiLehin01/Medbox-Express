export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils";

// GET all pharmacies or nearby pharmacies
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const radius = parseFloat(searchParams.get("radius") || "10");

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        verified: true,
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        products: {
          select: {
            id: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate distances if location provided
    let result = pharmacies.map((pharmacy) => {
      const avgRating =
        pharmacy.reviews.length > 0
          ? pharmacy.reviews.reduce((sum, r) => sum + r.rating, 0) /
            pharmacy.reviews.length
          : 0;

      const pharmacyData = {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        latitude: pharmacy.latitude,
        longitude: pharmacy.longitude,
        verified: pharmacy.verified,
        openTime: pharmacy.openTime,
        closeTime: pharmacy.closeTime,
        productCount: pharmacy.products.length,
        rating: avgRating,
        distance: 0,
      };

      if (latitude && longitude) {
        pharmacyData.distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          pharmacy.latitude,
          pharmacy.longitude
        );
      }

      return pharmacyData;
    });

    // Filter by radius if location provided
    if (latitude && longitude) {
      result = result.filter((p) => p.distance <= radius);
      result.sort((a, b) => a.distance - b.distance);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get pharmacies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 500 }
    );
  }
}
