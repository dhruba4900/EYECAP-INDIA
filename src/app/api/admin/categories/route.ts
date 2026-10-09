import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Convert a category name into a URL-friendly slug.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

/**
 * Parse optional boolean values safely.
 */
function parseBoolean(
  value: unknown,
  fallback: boolean
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

/**
 * GET /api/admin/categories
 *
 * Returns all categories for the admin panel,
 * including inactive categories and product counts.
 */
export async function GET() {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const categories = await prisma.category.findMany({
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
          where: {
            product: {
              isPublished: true,
            },
          },
          select: {
            productId: true,
          },
        },
      },
    });

    const result = categories.map((category) => {
      const productIds = new Set<string>();

      for (const product of category.products) {
        productIds.add(product.id);
      }

      for (const assignment of category.productCategories) {
        productIds.add(assignment.productId);
      }

      const {
        products,
        productCategories,
        ...categoryData
      } = category;

      return {
        ...categoryData,
        _count: {
          products: productIds.size,
        },
        productCount: productIds.size,
      };
    });

    return NextResponse.json(
      { categories: result },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin categories GET error:",
      error
    );

    return NextResponse.json(
      { error: "Failed to load categories." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 *
 * Creates a new category.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Category name cannot exceed 100 characters.",
        },
        { status: 400 }
      );
    }

    const requestedSlug =
      typeof data.slug === "string"
        ? data.slug.trim()
        : "";

    const slug = slugify(requestedSlug || name);

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "A valid category name or slug is required.",
        },
        { status: 400 }
      );
    }

    const description =
      typeof data.description === "string"
        ? data.description.trim() || null
        : null;

    const bannerImage =
      typeof data.bannerImage === "string"
        ? data.bannerImage.trim() || null
        : null;

    const rawDisplayOrder = data.displayOrder;

    const displayOrder =
      rawDisplayOrder === undefined ||
      rawDisplayOrder === null ||
      rawDisplayOrder === ""
        ? 0
        : Number(rawDisplayOrder);

    if (
      !Number.isFinite(displayOrder) ||
      !Number.isInteger(displayOrder)
    ) {
      return NextResponse.json(
        {
          error:
            "Display order must be a valid integer.",
        },
        { status: 400 }
      );
    }

    const isActive = parseBoolean(
      data.isActive,
      true
    );

    const showInNavigation = parseBoolean(
      data.showInNavigation,
      true
    );

    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (existing) {
      const duplicateField =
        existing.name.toLowerCase() === name.toLowerCase()
          ? "name"
          : "slug";

      return NextResponse.json(
        {
          error:
            duplicateField === "name"
              ? "A category with this name already exists."
              : "A category with this slug already exists.",
          existingCategory: existing,
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        bannerImage,
        displayOrder,
        isActive,
        showInNavigation,
      },
    });

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "CATEGORY_CREATED",
          entityType: "Category",
          entityId: category.id,
          details: JSON.stringify({
            name: category.name,
            slug: category.slug,
            isActive: category.isActive,
            showInNavigation: category.showInNavigation,
          }),
        },
      })
      .catch((auditError) => {
        console.error(
          "Category audit log failed:",
          auditError
        );
      });

    return NextResponse.json(
      {
        category: {
          ...category,
          _count: {
            products: 0,
          },
          productCount: 0,
        },
        message: "Category created successfully.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      "Admin categories POST error:",
      error
    );

    const prismaError = error as {
      code?: string;
    };

    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A category with this name or slug already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category." },
      { status: 500 }
    );
  }
}