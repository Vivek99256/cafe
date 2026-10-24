import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { label, capacity, isActive } = await req.json();

    const table = await prisma.table.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const updated = await prisma.table.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, table: updated });
  } catch (error) {
    console.error("Update table error:", error);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const table = await prisma.table.findFirst({
      where: { id, cafeId: session.cafeId },
      include: {
        orders: {
          select: { id: true, status: true },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const hasActiveOrders = table.orders.some((o) =>
      ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status)
    );

    if (hasActiveOrders) {
      return NextResponse.json(
        { error: "Cannot remove table while it has active pending or in-kitchen orders." },
        { status: 400 }
      );
    }

    // If table has past completed/cancelled order history, soft-delete (deactivate) so financial records are preserved
    if (table.orders.length > 0) {
      await prisma.table.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        archived: true,
        message: "Table has past order history. It has been archived and removed from active service.",
      });
    }

    // If table has never had any orders, hard delete is safe
    await prisma.table.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Delete table error:", error);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
