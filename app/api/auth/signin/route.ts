export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";

const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    // Ensure the request contains JSON.
    const contentType = req.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    // Parse request body safely.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    // Validate input.
    const validatedData = signinSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validatedData.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { email, password } = validatedData.data;

    // Confirm the JWT secret is configured.
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret || jwtSecret.length < 32) {
      console.error(
        "Signin configuration error: JWT_SECRET is missing or too short.",
      );

      return NextResponse.json(
        { error: "Authentication service is not configured correctly" },
        { status: 500 },
      );
    }

    // Look up the account.
    let user;

    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Signin database lookup failed:", error);

      return NextResponse.json(
        { error: "Unable to authenticate at this time" },
        { status: 503 },
      );
    }

    // Use the same public response for an unknown email or wrong password.
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify the password.
    let isValid: boolean;

    try {
      isValid = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("Signin password verification failed:", error);

      return NextResponse.json(
        { error: "Unable to authenticate at this time" },
        { status: 500 },
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Prevent blocked accounts from signing in.
    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { error: "Your account has been blocked. Please contact support." },
        { status: 403 },
      );
    }

    // Generate the authentication token.
    let token: string;

    try {
      const secret = new TextEncoder().encode(jwtSecret);

      token = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
    } catch (error) {
      console.error("Signin JWT generation failed:", error);

      return NextResponse.json(
        { error: "Unable to complete sign-in at this time" },
        { status: 500 },
      );
    }

    // Return the authenticated user and set HTTP-only cookies.
    const response = NextResponse.json(
      {
        message: "Signin successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    response.cookies.set("auth-token", token, cookieOptions);

    response.cookies.set("user-role", user.role, cookieOptions);

    console.info("Signin successful:", {
      userId: user.id,
      role: user.role,
    });

    return response;
  } catch (error) {
    console.error("Unexpected signin route error:", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown server error",
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    });

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
