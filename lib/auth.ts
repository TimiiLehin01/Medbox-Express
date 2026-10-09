import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export type Session = {
  userId: string;
  role: string;
};

export async function getSession(): Promise<Session | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in the environment");

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    if (
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
