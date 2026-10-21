import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.menuCategory.findMany({
      where: { cafeId: session.cafeId },
      orderBy: { sortOrder: "asc" },
      include: {
        menuItems: {
          orderBy: { sortOrder: "asc" },
          include: {
            variants: true,
            addOns: true,
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Dashboard menu fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable = true,
      isFeatured = false,
      isSpecial = false,
      isVeg = true,
      isVegan = false,
      isSpicy = false,
      allergens,
      preparationTime = 10,
      variants = [],
      addOns = [],
    } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: "Category, item name, and price are required" },
        { status: 400 }
      );
    }

    // Verify category belongs to user's cafe
    const category = await prisma.menuCategory.findFirst({
      where: { id: categoryId, cafeId: session.cafeId },
    });

    if (!category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) slug = "item";

    const newItem = await prisma.menuItem.create({
      data: {
        cafeId: session.cafeId,
        categoryId,
        name: name.trim(),
        slug,
        description: description ? description.trim() : "",
        price: parseFloat(price) || 0,
        imageUrl: imageUrl || null,
        isAvailable,
        isFeatured,
        isSpecial,
        isVeg,
        isVegan,
        isSpicy,
        allergens: allergens || null,
        preparationTime: parseInt(preparationTime, 10) || 10,
        variants: {
          create: variants.map((v: { name: string; price: number; isDefault?: boolean }) => ({
            name: v.name,
            price: parseFloat(v.price.toString()),
            isDefault: !!v.isDefault,
          })),
        },
        addOns: {
          create: addOns.map((a: { name: string; price: number }) => ({
            name: a.name,
            price: parseFloat(a.price.toString()),
          })),
        },
      },
      include: {
        variants: true,
        addOns: true,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
