import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.menuItem.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isSpecial !== undefined && { isSpecial: body.isSpecial }),
        ...(body.isVeg !== undefined && { isVeg: body.isVeg }),
        ...(body.isVegan !== undefined && { isVegan: body.isVegan }),
        ...(body.isSpicy !== undefined && { isSpicy: body.isSpicy }),
        ...(body.allergens !== undefined && { allergens: body.allergens }),
        ...(body.preparationTime !== undefined && { preparationTime: parseInt(body.preparationTime, 10) }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Update menu item error:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

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
    const { isAvailable } = await req.json();

    const existing = await prisma.menuItem.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Toggle item availability error:", error);
    return NextResponse.json({ error: "Failed to update item availability" }, { status: 500 });
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

    const existing = await prisma.menuItem.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
