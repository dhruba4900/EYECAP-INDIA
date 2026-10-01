import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            basePrice: true,
            frameMaterial: true,
            isPublished: true,
            category: { select: { name: true } },
            images: { take: 1 },
          },
        },
      },
      orderBy: { available: "asc" },
    });

    return NextResponse.json({ inventory });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { inventoryId, available, lowStockThreshold } = await req.json();

    if (!inventoryId) {
      return NextResponse.json({ error: "Inventory ID required" }, { status: 400 });
    }

    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        ...(available !== undefined ? { available: parseInt(available, 10) } : {}),
        ...(lowStockThreshold !== undefined
          ? { lowStockThreshold: parseInt(lowStockThreshold, 10) }
          : {}),
      },
      include: { product: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "INVENTORY_ADJUSTED",
        entityType: "Inventory",
        entityId: inventoryId,
        details: JSON.stringify({
          productName: updated.product.name,
          newAvailable: updated.available,
          newThreshold: updated.lowStockThreshold,
        }),
      },
    });

    return NextResponse.json({ success: true, inventory: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
