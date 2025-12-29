import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ⚠️ UPDATE THIS to your prisma import path

export async function GET() {
  // Allow in development OR if demo mode is enabled
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !isDemoMode) {
    return NextResponse.json(
      { error: "Demo mode not enabled" },
      { status: 403 }
    );
  }

  try {
    // Fetch all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // ⚠️ ADD any other fields you want to display
      },
      orderBy: [
        { role: "asc" }, // Group by role
        { email: "asc" }, // Then alphabetically
      ],
    });

    // Format profiles
    const profiles = users.map((user) => ({
      id: user.id,
      name: user.name || user.email.split("@")[0], // Fallback to email prefix if no name
      email: user.email,
      role: user.role,
    }));

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
