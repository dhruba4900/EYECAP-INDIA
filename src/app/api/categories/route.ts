import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isNavigation = searchParams.get("navigation") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause: {
      isActive?: boolean;
      showInNavigation?: boolean;
    } = {};

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    if (isNavigation) {
      whereClause.showInNavigation = true;
    }

    const categories = await prisma.category.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        products: {
          where: { isPublished: true },
          select: { id: true },
        },
        productCategories: {
          where: { product: { isPublished: true } },
          select: { productId: true },
        },
      },
    });

    const formatted = categories.map((cat) => {
      const productIds = new Set<string>();
      for (const p of cat.products) productIds.add(p.id);
      for (const pc of cat.productCategories) productIds.add(pc.productId);

      const { products: _products, productCategories: _pcs, ...categoryData } = cat;

      return {
        ...categoryData,
        _count: {
          products: productIds.size,
        },
        productCount: productIds.size,
      };
    });

    return NextResponse.json(
      { categories: formatted },
      {
        headers: {
          "Cache-Control": "public, s-maxage=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Public categories GET error:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
