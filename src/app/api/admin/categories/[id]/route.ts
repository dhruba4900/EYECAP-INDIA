import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
 * PATCH /api/admin/categories/[id]
 *
 * Updates category details or visibility.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 }
      );
    }

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

    const input = body as Record<string, unknown>;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      bannerImage?: string | null;
      displayOrder?: number;
      isActive?: boolean;
      showInNavigation?: boolean;
    } = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string") {
        return NextResponse.json(
          { error: "Category name must be text." },
          { status: 400 }
        );
      }

      const name = input.name.trim();

      if (!name || name.length > 100) {
        return NextResponse.json(
          {
            error:
              "Category name must contain 1–100 characters.",
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (input.slug !== undefined) {
      if (typeof input.slug !== "string") {
        return NextResponse.json(
          { error: "Category slug must be text." },
          { status: 400 }
        );
      }

      const slug = slugify(input.slug);

      if (!slug) {
        return NextResponse.json(
          { error: "Please provide a valid slug." },
          { status: 400 }
        );
      }

      data.slug = slug;
    } else if (input.name !== undefined) {
      // Keep the URL slug synchronized when the name changes,
      // unless the request explicitly supplies a slug.
      data.slug = slugify(String(input.name));
    }

    if (input.description !== undefined) {
      if (
        input.description !== null &&
        typeof input.description !== "string"
      ) {
        return NextResponse.json(
          { error: "Description must be text or null." },
          { status: 400 }
        );
      }

      data.description =
        typeof input.description === "string"
          ? input.description.trim() || null
          : null;
    }

    if (input.bannerImage !== undefined) {
      if (
        input.bannerImage !== null &&
        typeof input.bannerImage !== "string"
      ) {
        return NextResponse.json(
          { error: "Banner image must be text or null." },
          { status: 400 }
        );
      }

      data.bannerImage =
        typeof input.bannerImage === "string"
          ? input.bannerImage.trim() || null
          : null;
    }

    if (input.displayOrder !== undefined) {
      const displayOrder = Number(input.displayOrder);

      if (
        !Number.isInteger(displayOrder) ||
        !Number.isFinite(displayOrder)
      ) {
        return NextResponse.json(
          { error: "Display order must be an integer." },
          { status: 400 }
        );
      }

      data.displayOrder = displayOrder;
    }

    if (input.isActive !== undefined) {
      if (typeof input.isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be true or false." },
          { status: 400 }
        );
      }

      data.isActive = input.isActive;
    }

    if (input.showInNavigation !== undefined) {
      if (typeof input.showInNavigation !== "boolean") {
        return NextResponse.json(
          {
            error:
              "showInNavigation must be true or false.",
          },
          { status: 400 }
        );
      }

      data.showInNavigation = input.showInNavigation;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields were provided to update." },
        { status: 400 }
      );
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(data.name !== undefined
            ? [{ name: data.name }]
            : []),
          ...(data.slug !== undefined
            ? [{ slug: data.slug }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Another category already uses this name or slug.",
          existingCategory: duplicate,
        },
        { status: 409 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "CATEGORY_UPDATED",
          entityType: "Category",
          entityId: category.id,
          details: JSON.stringify({
            previous: {
              name: existing.name,
              slug: existing.slug,
            },
            updated: data,
          }),
        },
      })
      .catch((error) => {
        console.error("Category audit log failed:", error);
      });

    return NextResponse.json({
      category,
      message: "Category updated successfully.",
    });
  } catch (error: unknown) {
    console.error("Admin category PATCH error:", error);

    const prismaError = error as { code?: string };

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
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 *
 * Deletes the category and its category assignments only.
 * Products, images, inventory, prices and orders are preserved.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Remove only many-to-many assignments.
      await tx.productCategory.deleteMany({
        where: { categoryId: id },
      });

      // Product.categoryId must be nullable in the schema.
      // Preserve products that used this as their legacy category.
      await tx.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });

      // Delete the category itself, not its products.
      await tx.category.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "CATEGORY_DELETED",
          entityType: "Category",
          entityId: id,
          details: JSON.stringify({
            name: category.name,
            slug: category.slug,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Category deleted. Products and their related data were preserved.",
      deletedCategory: category,
    });
  } catch (error: unknown) {
    console.error("Admin category DELETE error:", error);

    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "This category could not be deleted because another record depends on it.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}