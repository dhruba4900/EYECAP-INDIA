import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("category")?.trim().toLowerCase() || "";
    const shape = searchParams.get("shape")?.trim() || "";
    const sort = searchParams.get("sort") || "featured";
    const featuredOnly = searchParams.get("featured") === "true";

    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "12", 10);

    const page = Number.isFinite(requestedPage)
      ? Math.max(1, requestedPage)
      : 1;

    const limit = Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, requestedLimit))
      : 12;

    const skip = (page - 1) * limit;

    const rawMinPrice = searchParams.get("minPrice");
    const rawMaxPrice = searchParams.get("maxPrice");

    const minPrice =
      rawMinPrice !== null && rawMinPrice.trim() !== ""
        ? Number(rawMinPrice)
        : undefined;

    const maxPrice =
      rawMaxPrice !== null && rawMaxPrice.trim() !== ""
        ? Number(rawMaxPrice)
        : undefined;

    if (
      (minPrice !== undefined && !Number.isFinite(minPrice)) ||
      (maxPrice !== undefined && !Number.isFinite(maxPrice)) ||
      (minPrice !== undefined && minPrice < 0) ||
      (maxPrice !== undefined && maxPrice < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid price filter." },
        { status: 400 }
      );
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return NextResponse.json(
        { error: "Minimum price cannot exceed maximum price." },
        { status: 400 }
      );
    }

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
    };

    if (featuredOnly) {
      where.isFeatured = true;
    }

    const conditions: Prisma.ProductWhereInput[] = [];

    // Product search
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { headline: { contains: search, mode: "insensitive" } },
          { frameMaterial: { contains: search, mode: "insensitive" } },
          { modelNumber: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Category filtering:
    // Support both the legacy primary category and the new
    // many-to-many ProductCategory relationship.
    // "all" means every published product, regardless of category.
    if (categorySlug && categorySlug !== "all") {
      conditions.push({
        OR: [
          {
            category: {
              is: {
                slug: categorySlug,
                isActive: true,
              },
            },
          },
          {
            productCategories: {
              some: {
                category: {
                  slug: categorySlug,
                  isActive: true,
                },
              },
            },
          },
        ],
      });
    }

    if (shape && shape.toLowerCase() !== "all") {
      where.frameShape = shape;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};

      if (minPrice !== undefined) {
        where.basePrice.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        where.basePrice.lte = maxPrice;
      }
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    let orderBy:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[] = {
      createdAt: "desc",
    };

    switch (sort) {
      case "price_asc":
        orderBy = { basePrice: "asc" };
        break;

      case "price_desc":
        orderBy = { basePrice: "desc" };
        break;

      case "rating":
        orderBy = { rating: "desc" };
        break;

      case "newest":
        orderBy = { createdAt: "desc" };
        break;

      case "featured":
      default:
        orderBy = [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ];
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,

        include: {
          // Legacy primary category: preserve compatibility
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          // All assigned active categories
          productCategories: {
            where: {
              category: {
                isActive: true,
              },
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },

          images: {
            orderBy: {
              displayOrder: "asc",
            },
            take: 2,
          },

          variants: {
            take: 4,
          },

          inventory: {
            select: {
              available: true,
              lowStockThreshold: true,
            },
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

    return NextResponse.json(
      {
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Products query error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve products catalog." },
      { status: 500 }
    );
  }
}
