import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  getCookieOptions,
  COOKIE_NAME,
  AuthSession,
} from "@/lib/auth";
import { runDatabaseSeed } from "@/lib/seed-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.toLowerCase()?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if database has users; if empty, auto-seed it on live!
    let totalUsers = 0;
    try {
      totalUsers = await prisma.user.count();
    } catch (dbErr: unknown) {
      console.error("Database connection error:", dbErr);
      return NextResponse.json(
        {
          error: "DATABASE_CONNECTION_ERROR",
          message:
            "Could not connect to database. Please verify DATABASE_URL in your deployment environment variables.",
          details: dbErr instanceof Error ? dbErr.message : String(dbErr),
        },
        { status: 500 }
      );
    }

    if (totalUsers === 0) {
      console.log("Empty database detected. Auto-seeding initial accounts...");
      await runDatabaseSeed(prisma);
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { cafe: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: `No account found with email "${email}". If this is your first time on live, try owner@auracafe.com (Password: Owner@1234) or register your cafe.`,
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
          message: "Incorrect password. For demo accounts use: Owner@1234 or Admin@1234.",
        },
        { status: 401 }
      );
    }

    const activeMembership = user.memberships[0];

    const sessionPayload: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      cafeId: activeMembership?.cafeId,
      cafeSlug: activeMembership?.cafe?.slug,
      cafeName: activeMembership?.cafe?.name,
    };

    const token = await createSessionToken(sessionPayload);

    // Also set via cookieStore helper
    try {
      await setSessionCookie(token);
    } catch {
      // In some route handler contexts cookieStore is read-only
    }

    const redirectTo =
      user.role === "SUPER_ADMIN"
        ? "/admin"
        : user.role === "KITCHEN_STAFF"
        ? "/dashboard/orders"
        : "/dashboard";

    // Explicitly set cookie on NextResponse headers for 100% reliability across Vercel / serverless
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafeId: sessionPayload.cafeId,
        cafeSlug: sessionPayload.cafeSlug,
        cafeName: sessionPayload.cafeName,
      },
      redirectTo,
    });

    response.cookies.set(COOKIE_NAME, token, getCookieOptions());

    return response;
  } catch (error: unknown) {
    console.error("Login route error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal login error occurred",
      },
      { status: 500 }
    );
  }
}
