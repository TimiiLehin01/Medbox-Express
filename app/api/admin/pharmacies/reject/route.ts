// app/api/admin/pharmacies/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user-role")?.value;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { pharmacyId, reason } = await req.json();

    if (!pharmacyId || !reason) {
      return NextResponse.json(
        { error: "Pharmacy ID and reason required" },
        { status: 400 }
      );
    }

    const pharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        user: {
          update: {
            status: "BLOCKED",
          },
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pharmacy rejected",
      pharmacy,
    });
  } catch (error) {
    console.error("Error rejecting pharmacy:", error);
    return NextResponse.json(
      { error: "Failed to reject pharmacy" },
      { status: 500 }
    );
  }
}
