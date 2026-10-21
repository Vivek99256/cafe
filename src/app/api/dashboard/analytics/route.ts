import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cafeId = session.cafeId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Fetch all cafe orders
    const allOrders = await prisma.order.findMany({
      where: { cafeId },
      include: {
        table: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const todayOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= startOfToday
    );

    const validTodayOrders = todayOrders.filter((o) => o.status !== "CANCELLED");
    const todaySales = validTodayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrdersCount = allOrders.filter((o) => o.status === "PENDING").length;
    const preparingOrdersCount = allOrders.filter((o) => o.status === "PREPARING").length;
    const readyOrdersCount = allOrders.filter((o) => o.status === "READY").length;

    const validAllOrders = allOrders.filter((o) => o.status !== "CANCELLED");
    const totalAllSales = validAllOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = validAllOrders.length > 0
      ? Math.round((totalAllSales / validAllOrders.length) * 100) / 100
      : 0;

    // 2. Best-selling items calculation
    const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of validAllOrders) {
      for (const item of order.items) {
        const existing = itemSalesMap.get(item.name) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.totalPrice;
        itemSalesMap.set(item.name, existing);
      }
    }

    const topSellingItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Last 7 days trend
    const last7Days: Array<{ date: string; label: string; sales: number; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = validAllOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const daySales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      last7Days.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        sales: Math.round(daySales),
        count: dayOrders.length,
      });
    }

    // 4. Status distribution
    const statusDistribution = {
      pending: pendingOrdersCount,
      accepted: allOrders.filter((o) => o.status === "ACCEPTED").length,
      preparing: preparingOrdersCount,
      ready: readyOrdersCount,
      served: allOrders.filter((o) => o.status === "SERVED").length,
      cancelled: allOrders.filter((o) => o.status === "CANCELLED").length,
    };

    return NextResponse.json({
      todaySales,
      todayOrderCount: todayOrders.length,
      pendingCount: pendingOrdersCount,
      preparingCount: preparingOrdersCount,
      readyCount: readyOrdersCount,
      avgOrderValue,
      totalSales: totalAllSales,
      totalOrdersCount: allOrders.length,
      topSellingItems,
      last7Days,
      statusDistribution,
      recentOrders: allOrders.slice(0, 6),
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return NextResponse.json({ error: "Failed to calculate analytics" }, { status: 500 });
  }
}
