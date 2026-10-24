import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.cafeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { cafeId: session.cafeId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            table: { select: { tableNumber: true } },
          },
        },
      },
    });

    const total = feedbacks.length;
    const avgRating = total > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
      : "0.0";
    const fiveStarCount = feedbacks.filter((f) => f.rating === 5).length;
    const googleReferralCount = feedbacks.filter((f) => f.googleReviewClicked).length;

    return NextResponse.json({
      feedbacks,
      stats: {
        totalReviews: total,
        averageRating: parseFloat(avgRating),
        fiveStarCount,
        googleReferralCount,
      },
    });
  } catch (error) {
    console.error("Dashboard feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedbacks." }, { status: 500 });
  }
}
