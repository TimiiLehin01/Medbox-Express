import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Get auth from cookies instead of NextAuth
    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "RIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();

    const rider = await prisma.rider.update({
      where: { userId: userId },
      data: {
        latitude,
        longitude,
      },
    });

    return NextResponse.json(rider);
  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
