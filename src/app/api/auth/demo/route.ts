import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSessionToken, setSessionCookie, AuthSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    let targetEmail = "owner@auracafe.com";
    if (role === "SUPER_ADMIN") targetEmail = "admin@cafesaas.com";
    if (role === "CAFE_MANAGER") targetEmail = "manager@auracafe.com";
    if (role === "KITCHEN_STAFF") targetEmail = "kitchen@auracafe.com";
    if (role === "BELLA_OWNER") targetEmail = "owner@bellacucina.com";

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        memberships: {
          include: { cafe: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Demo user not found. Please run seed." }, { status: 404 });
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
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cafeId: sessionPayload.cafeId,
        cafeSlug: sessionPayload.cafeSlug,
        cafeName: sessionPayload.cafeName,
      },
      redirectTo: user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
