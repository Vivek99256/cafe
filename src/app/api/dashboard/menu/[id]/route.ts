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
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isSpecial !== undefined && { isSpecial: body.isSpecial }),
        ...(body.isVeg !== undefined && { isVeg: body.isVeg }),
        ...(body.isVegan !== undefined && { isVegan: body.isVegan }),
        ...(body.isSpicy !== undefined && { isSpicy: body.isSpicy }),
        ...(body.allergens !== undefined && { allergens: body.allergens || null }),
        ...(body.preparationTime !== undefined && { preparationTime: parseInt(body.preparationTime, 10) }),
        ...(body.trackStock !== undefined && { trackStock: Boolean(body.trackStock) }),
        ...(body.stockQuantity !== undefined && {
          stockQuantity: parseInt(body.stockQuantity.toString(), 10) || 0,
          ...(parseInt(body.stockQuantity.toString(), 10) === 0 ? { isAvailable: false } : {}),
        }),
        ...(body.dailyStock !== undefined && { dailyStock: parseInt(body.dailyStock.toString(), 10) || 0 }),
      },
    });

    if (Array.isArray(body.variants)) {
      await prisma.productVariant.deleteMany({ where: { menuItemId: id } });
      if (body.variants.length > 0) {
        await prisma.productVariant.createMany({
          data: body.variants.map((v: { name: string; price: number; isDefault?: boolean }) => ({
            menuItemId: id,
            name: v.name,
            price: parseFloat(v.price.toString()),
            isDefault: !!v.isDefault,
          })),
        });
      }
    }

    if (Array.isArray(body.addOns)) {
      await prisma.addOn.deleteMany({ where: { menuItemId: id } });
      if (body.addOns.length > 0) {
        await prisma.addOn.createMany({
          data: body.addOns.map((a: { name: string; price: number }) => ({
            menuItemId: id,
            name: a.name,
            price: parseFloat(a.price.toString()),
          })),
        });
      }
    }

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
    const body = await req.json();
    const { isAvailable, stockQuantity, trackStock } = body;

    const existing = await prisma.menuItem.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);
    if (trackStock !== undefined) data.trackStock = Boolean(trackStock);
    if (stockQuantity !== undefined) {
      const qty = Math.max(0, parseInt(stockQuantity.toString(), 10) || 0);
      data.stockQuantity = qty;
      if (qty === 0) {
        data.isAvailable = false;
      } else if (isAvailable === undefined && !existing.isAvailable && qty > 0) {
        data.isAvailable = true;
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
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
