import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin privileges required" }, { status: 403 });
    }

    const { id } = await context.params;
    const { isAcceptingOrders, subscriptionStatus } = await req.json();

    const cafe = await prisma.cafe.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!cafe) {
      return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (isAcceptingOrders !== undefined) {
        await tx.cafe.update({
          where: { id },
          data: { isAcceptingOrders },
        });
      }

      if (subscriptionStatus !== undefined && cafe.subscription) {
        await tx.subscription.update({
          where: { id: cafe.subscription.id },
          data: { status: subscriptionStatus },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin toggle cafe status error:", error);
    return NextResponse.json({ error: "Failed to update cafe status" }, { status: 500 });
  }
}
