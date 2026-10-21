import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "CAFE_OWNER" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only cafe owners can remove staff members." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const membership = await prisma.cafeMembership.findFirst({
      where: {
        id,
        cafeId: session.cafeId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    if (membership.role === "CAFE_OWNER") {
      return NextResponse.json(
        { error: "The primary cafe owner account cannot be deleted from staff." },
        { status: 400 }
      );
    }

    await prisma.cafeMembership.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to remove staff member" }, { status: 500 });
  }
}
