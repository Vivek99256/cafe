import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { broadcastOrderEvent } from "@/lib/realtime";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    const { status, note, rejectReason } = await request.json();

    const validStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Verify order belongs to the user's cafe
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        cafeId: session.cafeId,
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update status in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          rejectReason: rejectReason || null,
          paymentStatus: status === "SERVED" && order.paymentMethod === "PAY_AT_COUNTER" ? "PAID" : order.paymentStatus,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note: note || `Order marked as ${status} by ${session.name} (${session.role})`,
          changedBy: `${session.name} (${session.role})`,
        },
      });

      return updated;
    });

    // Broadcast status change
    broadcastOrderEvent({
      type: "STATUS_UPDATE",
      cafeId: session.cafeId,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      tableNumber: order.table.tableNumber,
      status: updatedOrder.status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
