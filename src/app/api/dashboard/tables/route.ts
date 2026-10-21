import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const tables = await prisma.table.findMany({
      where: { cafeId: session.cafeId },
      include: {
        orders: {
          where: {
            status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
          },
          select: { id: true, status: true, totalAmount: true },
        },
      },
      orderBy: { tableNumber: "asc" },
    });

    const cafe = await prisma.cafe.findUnique({
      where: { id: session.cafeId },
      select: { slug: true, name: true, logoUrl: true },
    });

    // Generate QR code data URLs for each table
    const enhancedTables = await Promise.all(
      tables.map(async (table) => {
        const orderUrl = `${baseUrl}/menu/${cafe?.slug}?table=${table.tableNumber}&token=${table.qrToken}`;
        let qrDataUrl = "";
        try {
          qrDataUrl = await QRCode.toDataURL(orderUrl, {
            errorCorrectionLevel: "H",
            margin: 2,
            color: {
              dark: "#2B1D18",
              light: "#FAF5EC",
            },
            width: 320,
          });
        } catch (e) {
          console.error("QR generation error:", e);
        }

        return {
          id: table.id,
          tableNumber: table.tableNumber,
          label: table.label,
          capacity: table.capacity,
          isActive: table.isActive,
          qrToken: table.qrToken,
          orderUrl,
          qrDataUrl,
          activeOrdersCount: table.orders.length,
          activeOrders: table.orders,
        };
      })
    );

    return NextResponse.json({
      tables: enhancedTables,
      cafe,
      baseUrl,
    });
  } catch (error) {
    console.error("Fetch tables error:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableNumber, label, capacity = 4 } = await req.json();

    if (!tableNumber) {
      return NextResponse.json({ error: "Table number is required" }, { status: 400 });
    }

    const cleanTableNumber = tableNumber.trim().toUpperCase();

    // Check duplicate
    const existing = await prisma.table.findFirst({
      where: {
        cafeId: session.cafeId,
        tableNumber: cleanTableNumber,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Table "${cleanTableNumber}" already exists in this cafe` },
        { status: 409 }
      );
    }

    const newTable = await prisma.table.create({
      data: {
        cafeId: session.cafeId,
        tableNumber: cleanTableNumber,
        label: label ? label.trim() : null,
        capacity: parseInt(capacity, 10) || 4,
        isActive: true,
        qrToken: crypto.randomBytes(16).toString("hex"),
      },
    });

    return NextResponse.json({ success: true, table: newTable });
  } catch (error) {
    console.error("Create table error:", error);
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
