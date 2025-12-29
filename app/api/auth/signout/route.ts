import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.json({ message: "Signed out successfully" });

  // Clear auth cookies
  response.cookies.delete("auth-token");
  response.cookies.delete("user-role");

  return response;
}
