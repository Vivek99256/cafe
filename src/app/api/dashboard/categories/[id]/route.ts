import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const category = await prisma.menuCategory.findFirst({
      where: { id, cafeId: session.cafeId },
      include: {
        menuItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

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
    const { name, description, sortOrder, isActive } = body;

    const existing = await prisma.menuCategory.findFirst({
      where: { id, cafeId: session.cafeId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      let baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!baseSlug) baseSlug = "category";

      slug = baseSlug;
      let counter = 1;
      let duplicate = await prisma.menuCategory.findFirst({
        where: { cafeId: session.cafeId, slug, NOT: { id } },
      });
      while (duplicate) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        duplicate = await prisma.menuCategory.findFirst({
          where: { cafeId: session.cafeId, slug, NOT: { id } },
        });
      }
    }

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        slug,
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder.toString(), 10) || 0 }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
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

    const existing = await prisma.menuCategory.findFirst({
      where: { id, cafeId: session.cafeId },
      include: {
        menuItems: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Clean up menu items, variants, and addons belonging to this category
    const itemIds = existing.menuItems.map((m) => m.id);
    if (itemIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { menuItemId: { in: itemIds } },
      });
      await prisma.addOn.deleteMany({
        where: { menuItemId: { in: itemIds } },
      });
      await prisma.menuItem.deleteMany({
        where: { id: { in: itemIds } },
      });
    }

    await prisma.menuCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
