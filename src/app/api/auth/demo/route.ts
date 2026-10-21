import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  getCookieOptions,
  COOKIE_NAME,
  AuthSession,
} from "@/lib/auth";
import { runDatabaseSeed } from "@/lib/seed-service";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let targetEmail = "owner@auracafe.com";
    if (role === "SUPER_ADMIN") targetEmail = "admin@cafesaas.com";
    if (role === "CAFE_MANAGER") targetEmail = "manager@auracafe.com";
    if (role === "KITCHEN_STAFF") targetEmail = "kitchen@auracafe.com";
    if (role === "BELLA_OWNER") targetEmail = "owner@bellacucina.com";

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        memberships: {
          include: { cafe: true },
        },
      },
    });

    // If user not found (e.g. live database was never seeded), auto-seed immediately!
    if (!user) {
      console.log(`Demo user ${targetEmail} not found. Running live database seed...`);
      await runDatabaseSeed(prisma);
      user = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: {
          memberships: {
            include: { cafe: true },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "DEMO_USER_NOT_FOUND",
          message: "Could not initialize demo user. Please check database connection.",
        },
        { status: 404 }
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

    try {
      await setSessionCookie(token);
    } catch {
      // In some route handler contexts cookieStore is read-only
    }

    const redirectTo = user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";

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
    console.error("Demo login error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Internal error during demo login",
      },
      { status: 500 }
    );
  }
}
