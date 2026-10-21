import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cafeSlug: string }> }
) {
  try {
    const { cafeSlug } = await context.params;
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get("table");
    const token = searchParams.get("token");

    const cafe = await prisma.cafe.findUnique({
      where: { slug: cafeSlug },
      include: {
        tables: {
          where: { isActive: true },
          select: {
            id: true,
            tableNumber: true,
            label: true,
            capacity: true,
            qrToken: true,
          },
        },
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
              include: {
                variants: {
                  orderBy: { price: "asc" },
                },
                addOns: {
                  orderBy: { price: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!cafe) {
      return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
    }

    // Determine current table
    let currentTable = null;
    let isTokenValid = false;

    if (tableNumber) {
      const found = cafe.tables.find(
        (t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase()
      );
      if (found) {
        currentTable = {
          id: found.id,
          tableNumber: found.tableNumber,
          label: found.label,
          capacity: found.capacity,
        };
        // If token provided, verify it
        if (token && token === found.qrToken) {
          isTokenValid = true;
        }
      }
    }

    return NextResponse.json({
      cafe: {
        id: cafe.id,
        name: cafe.name,
        slug: cafe.slug,
        tagline: cafe.tagline,
        description: cafe.description,
        logoUrl: cafe.logoUrl,
        coverUrl: cafe.coverUrl,
        phone: cafe.phone,
        email: cafe.email,
        address: cafe.address,
        city: cafe.city,
        currency: cafe.currency,
        currencySymbol: cafe.currencySymbol,
        taxRate: cafe.taxRate,
        isAcceptingOrders: cafe.isAcceptingOrders,
        openingHours: cafe.openingHours,
        estimatedPrepTime: cafe.estimatedPrepTime,
      },
      categories: cafe.categories,
      tables: cafe.tables.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        label: t.label,
      })),
      currentTable,
      isTokenValid,
    });
  } catch (error) {
    console.error("Fetch menu error:", error);
    return NextResponse.json({ error: "Failed to load cafe menu" }, { status: 500 });
  }
}
