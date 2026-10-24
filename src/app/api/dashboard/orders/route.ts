import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const tableId = searchParams.get("tableId");
    const dateRange = searchParams.get("dateRange"); // "today" | "all"

    const whereClause: Record<string, unknown> = {
      cafeId: session.cafeId,
    };

    if (status) {
      if (status === "active") {
        whereClause.status = { in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] };
      } else if (status === "live") {
        whereClause.status = { in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] };
      } else {
        whereClause.status = status;
      }
    }

    if (tableId) {
      whereClause.tableId = tableId;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { table: { tableNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (dateRange === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfDay };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: true,
        cafe: true,
        items: {
          include: {
            selectedAddOns: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Dashboard orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
