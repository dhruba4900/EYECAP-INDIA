import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createObjectDownloadUrl } from "@/lib/object-storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: "asc" },
        },
        variants: {
          orderBy: { priceAdjustment: "asc" },
        },
        model3d: { include: { asset: { select: { modelKey: true, status: true } } } },
        inventory: true,
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: "Product not found or currently unavailable" },
        { status: 404 }
      );
    }

    // Fetch 3 related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isPublished: true,
      },
      take: 3,
      include: {
        images: { take: 1 },
        category: true,
      },
    });

    const model3d = product.model3d;
    let publicModel3d: Omit<NonNullable<typeof model3d>, "asset"> | null = null;
    if (model3d) {
      const { asset, ...safeModel } = model3d;
      const modelUrl = asset
        ? asset.status === "PUBLISHED"
          ? await createObjectDownloadUrl(asset.modelKey, 900)
          : null
        : model3d.modelUrl;
      publicModel3d = { ...safeModel, modelUrl };
    }
    const response = NextResponse.json({ product: { ...product, model3d: publicModel3d }, related });
    if (model3d?.asset) {
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  } catch (error: any) {
    console.error("Product detail error:", error);
    return NextResponse.json(
      { error: "Failed to load product details" },
      { status: 500 }
    );
  }
}
