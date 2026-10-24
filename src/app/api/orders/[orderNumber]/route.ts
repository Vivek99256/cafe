import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            logoUrl: true,
            currencySymbol: true,
            estimatedPrepTime: true,
            googleReviewUrl: true,
            whatsappNotificationsEnabled: true,
          },
        },
        table: {
          select: {
            id: true,
            tableNumber: true,
            label: true,
          },
        },
        items: {
          include: {
            selectedAddOns: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        feedback: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const startOfDay = new Date(order.createdAt);
    startOfDay.setHours(0, 0, 0, 0);

    const rawTableOrders = await prisma.order.findMany({
      where: {
        tableId: order.tableId,
        cafeId: order.cafeId,
        createdAt: { gte: startOfDay },
        status: { not: "CANCELLED" },
      },
      include: {
        items: {
          include: {
            selectedAddOns: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Helper functions for matching customer session/group on the same table
    const getCleanPhone = (phone?: string | null) => {
      if (!phone) return "";
      const cleaned = phone.replace(/[^0-9]/g, "");
      return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    };
    const getCleanName = (name?: string | null) => (name || "").trim().toLowerCase();

    const currentPhone = getCleanPhone(order.customerPhone);
    const currentName = getCleanName(order.customerName);

    // Only combine orders into running table tab if they belong to the SAME customer group
    const tableOrders = rawTableOrders.filter((o) => {
      if (o.id === order.id) return true; // Always include current order

      // If current order is unpaid/active, never lump in already settled & served orders from earlier sessions
      if (order.paymentStatus === "UNPAID" && o.paymentStatus === "PAID" && o.status === "SERVED") {
        return false;
      }

      const oPhone = getCleanPhone(o.customerPhone);
      const oName = getCleanName(o.customerName);

      // If both orders have phone numbers, both phone (last 10 digits) AND name must match
      if (currentPhone && oPhone) {
        return currentPhone === oPhone && currentName === oName;
      }

      // If phone is missing on either, matching name is required
      return currentName.length > 0 && currentName === oName;
    });

    return NextResponse.json({ order, tableOrders });
  } catch (error) {
    console.error("Fetch order error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}
