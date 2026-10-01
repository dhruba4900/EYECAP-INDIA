import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a review" }, { status: 401 });
    }

    const { productId, rating, title, comment } = await req.json();

    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ error: "All review fields are required" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: parseInt(rating, 10),
        title,
        comment,
        isVerifiedPurchase: true,
      },
    });

    // Update product average rating
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Number(avg.toFixed(1)),
        reviewCount: allReviews.length,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
