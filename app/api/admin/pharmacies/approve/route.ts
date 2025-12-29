// app/api/admin/pharmacies/approve/route.ts
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

    const { pharmacyId } = await req.json();

    if (!pharmacyId) {
      return NextResponse.json(
        { error: "Pharmacy ID required" },
        { status: 400 }
      );
    }

    const pharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        verified: true,
        user: {
          update: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pharmacy approved successfully",
      pharmacy,
    });
  } catch (error) {
    console.error("Error approving pharmacy:", error);
    return NextResponse.json(
      { error: "Failed to approve pharmacy" },
      { status: 500 }
    );
  }
}
