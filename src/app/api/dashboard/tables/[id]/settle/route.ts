import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { broadcastOrderEvent } from "@/lib/realtime";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tableId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { paymentStatus = "PAID", paymentMethod = "CASH", markServed = true, orderIds: requestedOrderIds } = body;

    const table = await prisma.table.findFirst({
      where: { id: tableId, cafeId: session.cafeId },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Find orders for this table (or specific orderIds if passed from a customer tab)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const whereClause: {
      cafeId: string;
      status: { not: string };
      id?: { in: string[] };
      tableId?: string;
      createdAt?: { gte: Date };
      OR?: Array<{ paymentStatus: string } | { status: { in: string[] } }>;
    } = {
      cafeId: session.cafeId,
      status: { not: "CANCELLED" },
    };

    if (requestedOrderIds && Array.isArray(requestedOrderIds) && requestedOrderIds.length > 0) {
      whereClause.id = { in: requestedOrderIds };
    } else {
      whereClause.tableId = tableId;
      whereClause.createdAt = { gte: startOfDay };
      whereClause.OR = [
        { paymentStatus: "UNPAID" },
        { status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: "No active or unpaid orders for this table", settledCount: 0 });
    }

    const orderIds = orders.map((o) => o.id);

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        paymentStatus,
        paymentMethod,
      };
      if (markServed) {
        updateData.status = "SERVED";
      }

      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: updateData,
      });

      for (const order of orders) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: markServed ? "SERVED" : order.status,
            note: `Table #${table.tableNumber} combined settlement (${paymentStatus} via ${paymentMethod}) by ${session.name}`,
            changedBy: `${session.name} (${session.role})`,
          },
        });
      }
    });

    // Broadcast realtime event
    for (const order of orders) {
      broadcastOrderEvent({
        type: "STATUS_UPDATE",
        cafeId: session.cafeId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableNumber: table.tableNumber,
        status: markServed ? "SERVED" : order.status,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      settledCount: orders.length,
      tableNumber: table.tableNumber,
    });
  } catch (error) {
    console.error("Table settle error:", error);
    return NextResponse.json({ error: "Failed to settle table orders" }, { status: 500 });
  }
}
