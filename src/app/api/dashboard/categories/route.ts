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
          select: { id: true, name: true, price: true, isAvailable: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, sortOrder = 0 } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) slug = "category";

    // Ensure unique slug for cafe
    const baseSlug = slug;
    let existing = await prisma.menuCategory.findFirst({
      where: { cafeId: session.cafeId, slug },
    });
    let counter = 1;
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      existing = await prisma.menuCategory.findFirst({
        where: { cafeId: session.cafeId, slug },
      });
    }

    const category = await prisma.menuCategory.create({
      data: {
        cafeId: session.cafeId,
        name: name.trim(),
        slug,
        description: description ? description.trim() : null,
        sortOrder: parseInt(sortOrder, 10) || 0,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
