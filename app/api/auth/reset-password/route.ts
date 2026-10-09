export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
