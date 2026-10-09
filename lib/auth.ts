import { cookies } from "next/headers";
import { jwtVerify } from "jose";

/**
 * The signing secret for session tokens. Throws if it is missing or weak,
 * so a misconfigured deployment fails loudly instead of accepting forged tokens.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export type Session = {
  userId: string;
  role: string;
};

export async function getSession(): Promise<Session | null> {
  const secret = getJwtSecret();

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
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

/**
 * The role from the signed session token. Never read the plain "user-role"
 * cookie for authorization: anyone can edit their own cookies.
 */
export async function getVerifiedRole(): Promise<string | undefined> {
  const session = await getSession();
  return session?.role;
}
