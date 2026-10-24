import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      rating,
      foodRating,
      serviceRating,
      comment,
      googleReviewClicked = false,
    } = body;

    if (!orderNumber || !rating) {
      return NextResponse.json(
        { error: "Order number and rating are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            googleReviewUrl: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    const numFood = foodRating ? Math.max(1, Math.min(5, parseInt(foodRating, 10))) : null;
    const numService = serviceRating ? Math.max(1, Math.min(5, parseInt(serviceRating, 10))) : null;

    const feedback = await prisma.feedback.upsert({
      where: { orderId: order.id },
      update: {
        rating: numRating,
        foodRating: numFood,
        serviceRating: numService,
        comment: comment ? comment.trim() : null,
        googleReviewClicked: Boolean(googleReviewClicked),
      },
      create: {
        orderId: order.id,
        cafeId: order.cafeId,
        customerName: order.customerName,
        rating: numRating,
        foodRating: numFood,
        serviceRating: numService,
        comment: comment ? comment.trim() : null,
        googleReviewClicked: Boolean(googleReviewClicked),
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
      googleReviewUrl: order.cafe.googleReviewUrl,
    });
  } catch (error) {
    console.error("Save feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}
