import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const body = await req.json();

    const {
      name,
      headline,
      description,
      basePrice,
      comparePrice,
      frameShape,
      frameMaterial,
      lensMaterial,
      isFeatured,
      isPublished,
      availableStock,
      lowStockThreshold,
    } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(headline !== undefined ? { headline } : {}),
        ...(description ? { description } : {}),
        ...(basePrice !== undefined ? { basePrice: parseFloat(basePrice) } : {}),
        ...(comparePrice !== undefined
          ? { comparePrice: comparePrice ? parseFloat(comparePrice) : null }
          : {}),
        ...(frameShape ? { frameShape } : {}),
        ...(frameMaterial ? { frameMaterial } : {}),
        ...(lensMaterial ? { lensMaterial } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        inventory:
          availableStock !== undefined || lowStockThreshold !== undefined
            ? {
                upsert: {
                  create: {
                    available: parseInt(availableStock || "0", 10),
                    lowStockThreshold: parseInt(lowStockThreshold || "10", 10),
                  },
                  update: {
                    ...(availableStock !== undefined
                      ? { available: parseInt(availableStock, 10) }
                      : {}),
                    ...(lowStockThreshold !== undefined
                      ? { lowStockThreshold: parseInt(lowStockThreshold, 10) }
                      : {}),
                  },
                },
              }
            : undefined,
      },
      include: {
        inventory: true,
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_UPDATED",
        entityType: "Product",
        entityId: id,
        details: JSON.stringify({ name: updated.name }),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;

    // Toggle unpublish rather than destructive hard delete
    const archived = await prisma.product.update({
      where: { id },
      data: { isPublished: false },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_ARCHIVED",
        entityType: "Product",
        entityId: id,
        details: JSON.stringify({ name: archived.name }),
      },
    });

    return NextResponse.json({ success: true, message: "Product archived successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to archive product" }, { status: 500 });
  }
}
