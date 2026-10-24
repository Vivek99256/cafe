import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { broadcastOrderEvent } from "@/lib/realtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cafeId,
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      paymentMethod = "PAY_AT_COUNTER",
      items,
    } = body;

    if (!cafeId || !tableId || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order payload. Table, name, and items are required." },
        { status: 400 }
      );
    }

    // 1. Verify cafe
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
    });

    if (!cafe) {
      return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
    }

    if (!cafe.isAcceptingOrders) {
      return NextResponse.json(
        { error: "This cafe is currently not accepting new orders. Please check back later." },
        { status: 403 }
      );
    }

    // 2. Verify table
    const table = await prisma.table.findFirst({
      where: { id: tableId, cafeId, isActive: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Invalid or inactive dining table" }, { status: 400 });
    }

    // 3. Fetch menu items to calculate prices from database
    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        cafeId,
      },
      include: {
        variants: true,
        addOns: true,
      },
    });

    const itemMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // Check availability & inventory stock
    for (const item of items) {
      const dbItem = itemMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Item ${item.menuItemId} is not found on the menu.` },
          { status: 400 }
        );
      }
      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { error: `"${dbItem.name}" is currently sold out and cannot be ordered.` },
          { status: 400 }
        );
      }
      if (dbItem.trackStock) {
        const remaining = dbItem.stockQuantity ?? 0;
        const requestedQty = parseInt(item.quantity, 10) || 1;
        if (remaining < requestedQty) {
          return NextResponse.json(
            {
              error:
                remaining > 0
                  ? `"${dbItem.name}" only has ${remaining} left in stock. Please reduce your quantity.`
                  : `"${dbItem.name}" has just sold out!`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 4. Calculate prices securely on server
    let subtotal = 0;
    const processedOrderItems: Array<{
      menuItemId: string;
      name: string;
      variantName: string | null;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      specialInstructions: string | null;
      selectedAddOns: Array<{
        name: string;
        price: number;
        quantity: number;
      }>;
    }> = [];

    for (const item of items) {
      const dbItem = itemMap.get(item.menuItemId)!;
      let unitPrice = dbItem.price;
      let variantName: string | null = null;

      if (item.variantId) {
        const variant = dbItem.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantName = variant.name;
        }
      }

      // Addons
      let addonsSum = 0;
      const orderAddons: Array<{ name: string; price: number; quantity: number }> = [];

      if (item.addOnIds && Array.isArray(item.addOnIds)) {
        for (const addOnId of item.addOnIds) {
          const dbAddOn = dbItem.addOns.find((a) => a.id === addOnId);
          if (dbAddOn) {
            addonsSum += dbAddOn.price;
            orderAddons.push({
              name: dbAddOn.name,
              price: dbAddOn.price,
              quantity: 1,
            });
          }
        }
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemTotal = (unitPrice + addonsSum) * quantity;
      subtotal += itemTotal;

      processedOrderItems.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        variantName,
        unitPrice,
        quantity,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions ? item.specialInstructions.trim() : null,
        selectedAddOns: orderAddons,
      });
    }

    // Tax calculation
    const taxRate = cafe.taxRate || 5.0;
    const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Generate unique order number
    let orderNumber = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      orderNumber = `ORD-${randomDigits}`;
      const existing = await prisma.order.findUnique({ where: { orderNumber } });
      if (!existing) isUnique = true;
      attempts++;
    }

    // 5. Atomic transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          cafeId,
          tableId,
          customerName: customerName.trim(),
          customerPhone: customerPhone ? customerPhone.trim() : null,
          customerEmail: customerEmail ? customerEmail.trim() : null,
          status: "PENDING",
          subtotal,
          taxAmount,
          discountAmount: 0,
          totalAmount,
          paymentStatus: paymentMethod === "UPI_ONLINE" ? "PAID" : "UNPAID",
          paymentMethod,
          notes: notes ? notes.trim() : null,
        },
      });

      for (const pItem of processedOrderItems) {
        const createdOrderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: pItem.menuItemId,
            name: pItem.name,
            variantName: pItem.variantName,
            unitPrice: pItem.unitPrice,
            quantity: pItem.quantity,
            totalPrice: pItem.totalPrice,
            specialInstructions: pItem.specialInstructions,
          },
        });

        if (pItem.selectedAddOns.length > 0) {
          for (const addon of pItem.selectedAddOns) {
            await tx.orderItemAddOn.create({
              data: {
                orderItemId: createdOrderItem.id,
                name: addon.name,
                price: addon.price,
                quantity: addon.quantity,
              },
            });
          }
        }

        // Decrement inventory stock if tracking enabled
        const dbItem = itemMap.get(pItem.menuItemId);
        if (dbItem && dbItem.trackStock) {
          const currentStock = dbItem.stockQuantity ?? 0;
          const newStock = Math.max(0, currentStock - pItem.quantity);
          await tx.menuItem.update({
            where: { id: dbItem.id },
            data: {
              stockQuantity: newStock,
              ...(newStock === 0 ? { isAvailable: false } : {}),
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          note: `Order placed via QR code for Table ${table.tableNumber}`,
          changedBy: "Customer",
        },
      });

      return order;
    });

    // 6. Broadcast Realtime Event
    broadcastOrderEvent({
      type: "NEW_ORDER",
      cafeId,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      tableNumber: table.tableNumber,
      status: "PENDING",
      totalAmount: newOrder.totalAmount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalAmount: newOrder.totalAmount,
      tableNumber: table.tableNumber,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
