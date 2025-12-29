// app/api/orders/available/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!token || userRole !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Get rider info
    const rider = await prisma.rider.findUnique({
      where: { userId: userId },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    // Fetch orders that are ready for pickup and don't have a rider assigned
    const orders = await prisma.order.findMany({
      where: {
        status: "READY",
        riderId: null,
      },
      include: {
        consumer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            user: {
              // ← FIXED: Access phone through user relation
              select: {
                phone: true,
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate distance to each pharmacy if rider location is available
    const ordersWithDistance = orders.map((order) => {
      let distance = 0;

      if (rider.latitude && rider.longitude) {
        distance = calculateDistance(
          rider.latitude,
          rider.longitude,
          order.pharmacy.latitude,
          order.pharmacy.longitude
        );
      }

      return {
        ...order,
        distanceToPharmacy: distance,
      };
    });

    // Sort by distance (closest first) if we have location data
    if (rider.latitude && rider.longitude) {
      ordersWithDistance.sort(
        (a, b) => a.distanceToPharmacy - b.distanceToPharmacy
      );
    }

    return NextResponse.json(ordersWithDistance);
  } catch (error) {
    console.error("Error fetching available orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
