import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createObjectDownloadUrl } from "@/lib/object-storage";

const statusSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid asset status" }, { status: 400 });

  try {
    const asset = await prisma.productModelAsset.findUnique({
      where: { id: params.id },
      include: { product: { include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } } } },
    });
    if (!asset) return NextResponse.json({ error: "3D asset not found" }, { status: 404 });
    if (parsed.data.status === "PUBLISHED" && !asset.product.isPublished) {
      return NextResponse.json({ error: "Publish the product before publishing its 3D model" }, { status: 409 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.status === "PUBLISHED") {
        await tx.productModelAsset.updateMany({
          where: { productId: asset.productId, status: "PUBLISHED", id: { not: asset.id } },
          data: { status: "ARCHIVED" },
        });
        await tx.productModel3D.upsert({
          where: { productId: asset.productId },
          create: {
            productId: asset.productId,
            assetId: asset.id,
            posterUrl: asset.product.images[0]?.url || "",
          },
          update: { assetId: asset.id },
        });
      }
      const changed = await tx.productModelAsset.update({
        where: { id: asset.id },
        data: { status: parsed.data.status },
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: parsed.data.status === "PUBLISHED" ? "MODEL_ASSET_PUBLISHED" : "MODEL_ASSET_STATUS_UPDATED",
          entityType: "ProductModelAsset",
          entityId: asset.id,
          details: JSON.stringify({ productId: asset.productId, status: parsed.data.status }),
        },
      });
      return changed;
    });
    return NextResponse.json({ success: true, asset: { id: updated.id, status: updated.status } });
  } catch (error) {
    console.error("Admin 3D asset status update error:", error);
    return NextResponse.json({ error: "Failed to update 3D asset" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const asset = await prisma.productModelAsset.findUnique({
      where: { id: params.id },
      select: { sourceKey: true },
    });
    if (!asset?.sourceKey) return NextResponse.json({ error: "No Blender source is available" }, { status: 404 });
    const url = await createObjectDownloadUrl(asset.sourceKey, 300);
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "BLENDER_SOURCE_LINK_CREATED",
        entityType: "ProductModelAsset",
        entityId: params.id,
      },
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Admin Blender source link error:", error);
    return NextResponse.json({ error: "Failed to create source download link" }, { status: 500 });
  }
}
