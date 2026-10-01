import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const shape = searchParams.get("shape") || "";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sort = searchParams.get("sort") || "featured";
    const featuredOnly = searchParams.get("featured") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };
    if (featuredOnly) where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { headline: { contains: search } },
        { frameMaterial: { contains: search } },
      ];
    }

    if (category && category !== "all") {
      where.category = { slug: category };
    }

    if (shape && shape !== "all") {
      where.frameShape = shape;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { basePrice: "asc" };
    if (sort === "price_desc") orderBy = { basePrice: "desc" };
    if (sort === "rating") orderBy = { rating: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };
    if (sort === "featured") orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { displayOrder: "asc" },
            take: 2,
          },
          variants: {
            take: 4,
          },
          inventory: {
            select: { available: true, lowStockThreshold: true },
          },
          model3d: {
            select: {
              modelType: true,
              lensColor: true,
              frameColor: true,
              posterUrl: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Products query error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve products catalog" },
      { status: 500 }
    );
  }
}
