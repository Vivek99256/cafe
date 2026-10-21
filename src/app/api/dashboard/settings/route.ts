import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cafe = await prisma.cafe.findUnique({
      where: { id: session.cafeId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!cafe) {
      return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
    }

    return NextResponse.json({ cafe });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const updated = await prisma.cafe.update({
      where: { id: session.cafeId },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.tagline !== undefined && { tagline: body.tagline.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.phone !== undefined && { phone: body.phone.trim() }),
        ...(body.email !== undefined && { email: body.email.trim() }),
        ...(body.address !== undefined && { address: body.address.trim() }),
        ...(body.city !== undefined && { city: body.city.trim() }),
        ...(body.taxRate !== undefined && { taxRate: parseFloat(body.taxRate) }),
        ...(body.openingHours !== undefined && { openingHours: body.openingHours.trim() }),
        ...(body.isAcceptingOrders !== undefined && { isAcceptingOrders: body.isAcceptingOrders }),
        ...(body.tableOrderingEnabled !== undefined && { tableOrderingEnabled: body.tableOrderingEnabled }),
        ...(body.estimatedPrepTime !== undefined && { estimatedPrepTime: parseInt(body.estimatedPrepTime, 10) }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.coverUrl !== undefined && { coverUrl: body.coverUrl }),
      },
    });

    return NextResponse.json({ success: true, cafe: updated });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
