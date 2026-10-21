import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [memberships, cafe] = await Promise.all([
      prisma.cafeMembership.findMany({
        where: { cafeId: session.cafeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.cafe.findUnique({
        where: { id: session.cafeId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      }),
    ]);

    const maxStaff = cafe?.subscription?.plan?.maxStaff || 10;
    const canManageStaff = session.role === "CAFE_OWNER" || session.role === "SUPER_ADMIN";

    return NextResponse.json({
      memberships: memberships.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        isOwner: m.role === "CAFE_OWNER",
        createdAt: m.createdAt,
      })),
      maxStaff,
      currentStaffCount: memberships.length,
      canManageStaff,
    });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "CAFE_OWNER" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only cafe owners can create staff and manager accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role = "KITCHEN_STAFF", phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const validRoles = ["CAFE_MANAGER", "KITCHEN_STAFF"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role must be either CAFE_MANAGER or KITCHEN_STAFF" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check plan limits
    const [existingCount, cafe] = await Promise.all([
      prisma.cafeMembership.count({ where: { cafeId: session.cafeId } }),
      prisma.cafe.findUnique({
        where: { id: session.cafeId },
        include: { subscription: { include: { plan: true } } },
      }),
    ]);

    const maxAllowed = cafe?.subscription?.plan?.maxStaff || 10;
    if (existingCount >= maxAllowed) {
      return NextResponse.json(
        {
          error: `Staff limit reached (${maxAllowed} members max for your current plan). Please upgrade your subscription to add more staff.`,
        },
        { status: 403 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user) {
      // Check if already member of this cafe
      const existingMembership = await prisma.cafeMembership.findUnique({
        where: {
          userId_cafeId: {
            userId: user.id,
            cafeId: session.cafeId,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: `User with email "${cleanEmail}" is already a member of this cafe.` },
          { status: 409 }
        );
      }

      // Add membership for existing user
      const membership = await prisma.cafeMembership.create({
        data: {
          userId: user.id,
          cafeId: session.cafeId,
          role,
        },
        include: { user: true },
      });

      return NextResponse.json({
        success: true,
        member: {
          id: membership.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: membership.role,
        },
      });
    }

    // Create fresh user & membership
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role,
          phone: phone ? phone.trim() : null,
        },
      });

      const membership = await tx.cafeMembership.create({
        data: {
          userId: newUser.id,
          cafeId: session.cafeId!,
          role,
        },
      });

      return { user: newUser, membership };
    });

    return NextResponse.json({
      success: true,
      member: {
        id: result.membership.id,
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.membership.role,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}
