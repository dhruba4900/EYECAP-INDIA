import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, modelNumber: true, isPublished: true },
    });

    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    // Existing UI calls this "archive". We preserve the physical record rather
    // than deleting it, because ProductUnit/order history can depend on it.
    const updated = await prisma.product.update({
      where: { id },
      data: { isPublished: false },
      select: { id: true, name: true, modelNumber: true, isPublished: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_ARCHIVED",
        entityType: "Product",
        entityId: id,
        details: JSON.stringify({ previousPublished: product.isPublished }),
      },
    }).catch(() => {});

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("Admin product DELETE:", error);
    return NextResponse.json({ error: "Failed to archive product." }, { status: 500 });
  }
}
