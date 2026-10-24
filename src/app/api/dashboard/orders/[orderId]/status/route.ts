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
    const { status, note, rejectReason, paymentStatus, paymentMethod } = await request.json();

    const validStatuses = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    if (!status && !paymentStatus && !paymentMethod) {
      return NextResponse.json({ error: "No update parameters provided" }, { status: 400 });
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
      const dataToUpdate: Record<string, unknown> = {};
      if (status) {
        dataToUpdate.status = status;
        if (rejectReason !== undefined) {
          dataToUpdate.rejectReason = rejectReason || null;
        }
      }
      if (paymentStatus) {
        dataToUpdate.paymentStatus = paymentStatus;
      }
      if (paymentMethod) {
        dataToUpdate.paymentMethod = paymentMethod;
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: dataToUpdate,
      });

      // If order is cancelled, replenish stock for tracked items
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
        });
        for (const item of orderItems) {
          if (item.menuItemId) {
            const mItem = await tx.menuItem.findUnique({
              where: { id: item.menuItemId },
            });
            if (mItem && mItem.trackStock) {
              await tx.menuItem.update({
                where: { id: item.menuItemId },
                data: {
                  stockQuantity: (mItem.stockQuantity ?? 0) + item.quantity,
                  isAvailable: true,
                },
              });
            }
          }
        }
      }

      const historyNote =
        note ||
        (status && paymentStatus
          ? `Status set to ${status}, payment marked as ${paymentStatus}`
          : status
          ? `Order marked as ${status} by ${session.name} (${session.role})`
          : `Payment updated to ${paymentStatus} by ${session.name}`);

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: status || order.status,
          note: historyNote,
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
