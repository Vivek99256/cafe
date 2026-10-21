import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin privileges required" }, { status: 403 });
    }

    const cafes = await prisma.cafe.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        memberships: {
          where: { role: "CAFE_OWNER" },
          include: { user: true },
        },
        _count: {
          select: {
            tables: true,
            menuItems: true,
            orders: true,
          },
        },
        orders: {
          select: { totalAmount: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = cafes.map((cafe) => {
      const validOrders = cafe.orders.filter((o) => o.status !== "CANCELLED");
      const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const owner = cafe.memberships[0]?.user;

      return {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        city: cafe.city,
        createdAt: cafe.createdAt,
        isAcceptingOrders: cafe.isAcceptingOrders,
        owner: owner
          ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone }
          : null,
        subscription: cafe.subscription
          ? {
              status: cafe.subscription.status,
              planName: cafe.subscription.plan.name,
              planPrice: cafe.subscription.plan.price,
              currentPeriodEnd: cafe.subscription.currentPeriodEnd,
              isDevMode: cafe.subscription.isDevMode,
            }
          : null,
        tableCount: cafe._count.tables,
        menuItemsCount: cafe._count.menuItems,
        ordersCount: cafe._count.orders,
        totalRevenue: Math.round(totalRevenue),
      };
    });

    return NextResponse.json({ cafes: formatted });
  } catch (error) {
    console.error("Super admin fetch cafes error:", error);
    return NextResponse.json({ error: "Failed to fetch platform cafes" }, { status: 500 });
  }
}
