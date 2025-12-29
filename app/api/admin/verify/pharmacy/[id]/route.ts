import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth from cookies instead of NextAuth
    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verified } = await req.json();

    const pharmacy = await prisma.pharmacy.update({
      where: { id: params.id },
      data: { verified },
    });

    // Update user status
    await prisma.user.update({
      where: { id: pharmacy.userId },
      data: { status: verified ? "ACTIVE" : "BLOCKED" },
    });

    return NextResponse.json(pharmacy);
  } catch (error) {
    console.error("Verify pharmacy error:", error);
    return NextResponse.json(
      { error: "Failed to verify pharmacy" },
      { status: 500 }
    );
  }
}
