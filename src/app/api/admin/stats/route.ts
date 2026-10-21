import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin privileges required" }, { status: 403 });
    }

    const [totalCafes, totalOrders, totalTables, subscriptions, plans] = await Promise.all([
      prisma.cafe.count(),
      prisma.order.count(),
      prisma.table.count(),
      prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
      prisma.subscriptionPlan.findMany(),
    ]);

    const platformMRR = subscriptions.reduce((sum, s) => sum + s.plan.price, 0);

    const allOrders = await prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { totalAmount: true },
    });
    const platformGMV = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      totalCafes,
      totalOrders,
      totalTables,
      platformMRR,
      platformGMV: Math.round(platformGMV),
      plans,
    });
  } catch (error) {
    console.error("Super admin stats error:", error);
    return NextResponse.json({ error: "Failed to load platform stats" }, { status: 500 });
  }
}
