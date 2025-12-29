// app/api/admin/riders/[id]/approve/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;

    // Get auth from cookies instead of NextAuth
    const cookieStore = await cookies();
    const userId = cookieStore.get("auth-token")?.value;
    const userRole = cookieStore.get("user-role")?.value;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verified } = await req.json();

    const rider = await prisma.rider.update({
      where: { id: params.id },
      data: { verified },
    });

    await prisma.user.update({
      where: { id: rider.userId },
      data: { status: verified ? "ACTIVE" : "BLOCKED" },
    });

    return NextResponse.json(rider);
  } catch (error) {
    console.error("Verify rider error:", error);
    return NextResponse.json(
      { error: "Failed to verify rider" },
      { status: 500 }
    );
  }
}
