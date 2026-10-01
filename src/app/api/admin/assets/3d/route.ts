import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { deletePrivateObject, storePrivateObject } from "@/lib/object-storage";
import { validateGlb } from "@/lib/validate-glb";

export const runtime = "nodejs";

const MAX_GLB_BYTES = 20 * 1024 * 1024;
const MAX_BLEND_BYTES = 50 * 1024 * 1024;

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const assets = await prisma.productModelAsset.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: { product: { select: { name: true, sku: true } } },
    });
    return NextResponse.json({
      assets: assets.map(({ modelKey: _modelKey, sourceKey: _sourceKey, ...asset }) => asset),
    });
  } catch (error) {
    console.error("Admin 3D asset list error:", error);
    return NextResponse.json({ error: "Failed to load 3D assets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let uploadedKeys: string[] = [];
  try {
    const form = await request.formData();
    const fields = z.object({
      productId: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
    }).safeParse({
      productId: form.get("productId"),
      name: form.get("name"),
    });
    const modelFile = form.get("model");
    const sourceFile = form.get("source");
    if (!fields.success || !(modelFile instanceof File) || modelFile.size === 0) {
      return NextResponse.json({ error: "Product, asset name, and a GLB model are required" }, { status: 400 });
    }
    if (!modelFile.name.toLowerCase().endsWith(".glb") || modelFile.size > MAX_GLB_BYTES) {
      return NextResponse.json({ error: "Upload a GLB file no larger than 20 MB" }, { status: 400 });
    }
    if (sourceFile !== null && (!(sourceFile instanceof File) || sourceFile.size === 0 || !sourceFile.name.toLowerCase().endsWith(".blend") || sourceFile.size > MAX_BLEND_BYTES)) {
      return NextResponse.json({ error: "Optional Blender source must be a .blend file no larger than 50 MB" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: fields.data.productId },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const glb = Buffer.from(await modelFile.arrayBuffer());
    const metadata = validateGlb(glb);
    const sourceBytes = sourceFile instanceof File ? Buffer.from(await sourceFile.arrayBuffer()) : null;
    if (sourceBytes && sourceBytes.subarray(0, 7).toString("ascii") !== "BLENDER") {
      return NextResponse.json({ error: "Blender source is not a valid .blend file." }, { status: 400 });
    }
    const { _max } = await prisma.productModelAsset.aggregate({
      where: { productId: product.id },
      _max: { version: true },
    });
    const version = (_max.version || 0) + 1;
    const id = crypto.randomUUID();
    const modelKey = `models/${product.id}/${id}/web.glb`;
    const sourceKey = sourceBytes ? `models/${product.id}/${id}/source.blend` : null;

    await storePrivateObject(modelKey, glb, "model/gltf-binary");
    uploadedKeys.push(modelKey);
    if (sourceBytes && sourceKey) {
      await storePrivateObject(sourceKey, sourceBytes, "application/octet-stream");
      uploadedKeys.push(sourceKey);
    }

    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.productModelAsset.create({
        data: {
          id,
          productId: product.id,
          name: fields.data.name,
          version,
          modelKey,
          sourceKey,
          modelSize: glb.byteLength,
          sourceSize: sourceBytes?.byteLength ?? null,
          triangleCount: metadata.triangleCount,
          textureCount: metadata.textureCount,
          status: "DRAFT",
        },
        include: { product: { select: { name: true, sku: true } } },
      });
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "MODEL_ASSET_UPLOADED",
          entityType: "ProductModelAsset",
          entityId: created.id,
          details: JSON.stringify({
            name: created.name,
            productId: created.productId,
            version: created.version,
            modelSize: created.modelSize,
            sourceIncluded: !!created.sourceKey,
          }),
        },
      });
      return created;
    });
    const { modelKey: _modelKey, sourceKey: _sourceKey, ...summary } = asset;
    return NextResponse.json({ success: true, asset: summary }, { status: 201 });
  } catch (error) {
    for (const key of uploadedKeys) {
      try {
        await deletePrivateObject(key);
      } catch (cleanupError) {
        console.error(`Failed to clean up incomplete private model object ${key}:`, cleanupError);
      }
    }
    if (error instanceof Error && /GLB|glTF|model metadata|resource|chunk|Blender source/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Admin 3D asset upload error:", error);
    return NextResponse.json({ error: "Failed to upload 3D asset" }, { status: 500 });
  }
}
