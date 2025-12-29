// app/api/admin/pharmacies/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user-role")?.value;

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
      { status: 500 }
    );
  }
}
