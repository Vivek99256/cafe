import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aura_cafe_ultra_secure_jwt_secret_token_94827591_xyz"
);

export const COOKIE_NAME = "cafe_saas_session";

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: string; // "SUPER_ADMIN" | "CAFE_OWNER" | "CAFE_MANAGER" | "KITCHEN_STAFF"
  cafeId?: string; // Active cafe context
  cafeSlug?: string;
  cafeName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    // 1. Check cookies first
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;

    // 2. If cookie not present, check Authorization header (Bearer token)
    if (!token) {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, getCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(allowedRoles?: string[]): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireCafeAccess(
  targetCafeId: string,
  allowedRoles?: string[]
): Promise<AuthSession> {
  const session = await requireAuth(allowedRoles);
  if (session.role === "SUPER_ADMIN") {
    return session;
  }
  if (session.cafeId !== targetCafeId) {
    throw new Error("FORBIDDEN_CAFE_ACCESS");
  }
  return session;
}
