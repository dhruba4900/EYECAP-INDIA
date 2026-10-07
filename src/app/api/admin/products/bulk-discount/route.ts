import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const productIds = Array.isArray(body.productIds) ? body.productIds.map(String).filter(Boolean) : [];
    const discountPercent = Number(body.discountPercent);

    if (!productIds.length) return NextResponse.json({ error: "No products selected." }, { status: 400 });
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json({ error: "Discount must be between 0 and 100." }, { status: 400 });
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { discountPercent },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_BULK_DISCOUNT_UPDATED",
        entityType: "Product",
        details: JSON.stringify({ productIds, discountPercent, updatedCount: result.count }),
      },
    }).catch(() => {});

    return NextResponse.json({ updatedCount: result.count });
  } catch (error) {
    console.error("Bulk discount:", error);
    return NextResponse.json({ error: "Failed to apply bulk discount." }, { status: 500 });
  }
}
