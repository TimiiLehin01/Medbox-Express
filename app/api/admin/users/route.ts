// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const userRole = cookieStore.get("user-role")?.value;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all users with their pharmacy and rider info
    const users = await prisma.user.findMany({
      include: {
        pharmacy: true,
        rider: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Fetched users:", users.length); // Debug log

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
