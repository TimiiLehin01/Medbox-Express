export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const link = `${process.env.APP_URL}/auth/reset-password?token=${token}`;

      try {
        await sendMail(
          user.email,
          "Reset your MedBox Express password",
          `<p>Hi ${user.name},</p>
           <p>Click the link below to set a new password. It expires in 1 hour.</p>
           <p><a href="${link}">Reset password</a></p>
           <p>If you didn't ask for this, ignore this email.</p>`,
        );
      } catch (e) {
        console.error("Reset email failed:", e);
      }
    }

    // Same response whether or not the email exists
    return NextResponse.json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
