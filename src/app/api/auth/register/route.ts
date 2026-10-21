import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie, AuthSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { ownerName, email, password, cafeName, phone, city } = await req.json();

    if (!ownerName || !email || !password || !cafeName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    // Generate slug
    let baseSlug = cafeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "cafe";

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.cafe.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Default starter plan
    const starterPlan = await prisma.subscriptionPlan.findFirst({
      where: { slug: "starter-barista" },
    });

    const hashedPassword = await hashPassword(password);

    // Create User & Cafe in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          role: "CAFE_OWNER",
          phone: phone || null,
        },
      });

      const cafe = await tx.cafe.create({
        data: {
          name: cafeName,
          slug,
          city: city || "Bengaluru",
          currency: "INR",
          currencySymbol: "₹",
          taxRate: 5.0,
          isAcceptingOrders: true,
          coverUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
          logoUrl: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=250&q=80",
        },
      });

      await tx.cafeMembership.create({
        data: {
          userId: user.id,
          cafeId: cafe.id,
          role: "CAFE_OWNER",
        },
      });

      if (starterPlan) {
        await tx.subscription.create({
          data: {
            cafeId: cafe.id,
            planId: starterPlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isDevMode: true,
          },
        });
      }

      // Create starter tables T01, T02, T03
      for (let i = 1; i <= 3; i++) {
        await tx.table.create({
          data: {
            cafeId: cafe.id,
            tableNumber: `T0${i}`,
            label: `Dining Area ${i}`,
            capacity: 4,
            qrToken: crypto.randomBytes(16).toString("hex"),
          },
        });
      }

      // Create default starter category
      await tx.menuCategory.create({
        data: {
          cafeId: cafe.id,
          name: "Signature Beverages",
          slug: "signature-beverages",
          sortOrder: 1,
        },
      });

      return { user, cafe };
    });

    const sessionPayload: AuthSession = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      cafeId: result.cafe.id,
      cafeSlug: result.cafe.slug,
      cafeName: result.cafe.name,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      cafe: {
        id: result.cafe.id,
        name: result.cafe.name,
        slug: result.cafe.slug,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register cafe" }, { status: 500 });
  }
}
