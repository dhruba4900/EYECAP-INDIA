
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/* ============================================================
   HELPERS
============================================================ */

function asFiniteNumber(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asNonNegativeNumber(
  value: unknown,
  fallback = 0
): number {
  return Math.max(0, asFiniteNumber(value, fallback));
}

function asDate(value: unknown): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item).trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .map((item) => String(item).trim())
              .filter(Boolean)
          )
        );
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function parseJsonObject(
  value: unknown
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Invalid JSON falls back to an empty object.
    }
  }

  return {};
}

function hasOwn(
  object: Record<string, unknown>,
  key: string
): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/* ============================================================
   PATCH — UPDATE PRODUCT
============================================================ */

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
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
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid product update payload." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        modelNumber: true,
        sku: true,
        isPublished: true,
        categoryId: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    /* --------------------------------------------------------
       VALIDATE BASIC FIELDS
    -------------------------------------------------------- */

    const name = hasOwn(input, "name")
      ? String(input.name ?? "").trim()
      : undefined;

    const modelNumber = hasOwn(input, "modelNumber")
      ? String(input.modelNumber ?? "").trim().toUpperCase()
      : undefined;

    const sku = hasOwn(input, "sku")
      ? String(input.sku ?? "").trim().toUpperCase()
      : undefined;

    const description = hasOwn(input, "description")
      ? String(input.description ?? "").trim()
      : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: "Product name cannot be empty." },
        { status: 400 }
      );
    }

    if (modelNumber !== undefined && !modelNumber) {
      return NextResponse.json(
        { error: "Model number cannot be empty." },
        { status: 400 }
      );
    }

    if (sku !== undefined && !sku) {
      return NextResponse.json(
        { error: "SKU cannot be empty." },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      !description
    ) {
      return NextResponse.json(
        { error: "Product description cannot be empty." },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       VALIDATE UNIQUE MODEL NUMBER AND SKU
    -------------------------------------------------------- */

    if (
      modelNumber !== undefined ||
      sku !== undefined
    ) {
      const duplicateConditions = [];

      if (modelNumber !== undefined) {
        duplicateConditions.push({ modelNumber });
      }

      if (sku !== undefined) {
        duplicateConditions.push({ sku });
      }

      const duplicate = await prisma.product.findFirst({
        where: {
          id: { not: id },
          OR: duplicateConditions,
        },
        select: {
          modelNumber: true,
          sku: true,
        },
      });

      if (duplicate) {
        if (
          modelNumber !== undefined &&
          duplicate.modelNumber === modelNumber
        ) {
          return NextResponse.json(
            { error: "Model number already exists." },
            { status: 409 }
          );
        }

        if (
          sku !== undefined &&
          duplicate.sku === sku
        ) {
          return NextResponse.json(
            { error: "SKU already exists." },
            { status: 409 }
          );
        }
      }
    }

    /* --------------------------------------------------------
       CATEGORY INPUT

       If categoryIds is present, it takes precedence.
       Otherwise, a supplied legacy categoryId is supported.
       If neither is supplied, existing category assignments
       remain unchanged.
    -------------------------------------------------------- */

    const categoryUpdateRequested =
      hasOwn(input, "categoryIds") ||
      hasOwn(input, "categoryId");

    let categoryIds: string[] | undefined;

    if (hasOwn(input, "categoryIds")) {
      categoryIds = parseStringArray(input.categoryIds);
    } else if (hasOwn(input, "categoryId")) {
      const legacyCategoryId = String(
        input.categoryId ?? ""
      ).trim();

      categoryIds = legacyCategoryId
        ? [legacyCategoryId]
        : [];
    }

    if (
      categoryUpdateRequested &&
      (!categoryIds || categoryIds.length === 0)
    ) {
      return NextResponse.json(
        {
          error: "Select at least one product category.",
        },
        { status: 400 }
      );
    }

    if (categoryIds) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (categories.length !== categoryIds.length) {
        const foundIds = new Set(
          categories.map((category) => category.id)
        );

        return NextResponse.json(
          {
            error:
              "One or more selected categories do not exist or are inactive.",
            invalidCategoryIds: categoryIds.filter(
              (categoryId) => !foundIds.has(categoryId)
            ),
          },
          { status: 400 }
        );
      }
    }

    /* --------------------------------------------------------
       BUILD PRODUCT UPDATE DATA

       Only fields actually supplied by the client are changed.
       Fields omitted from the PATCH request remain unchanged.
    -------------------------------------------------------- */

    const updateData = {
      ...(name !== undefined ? { name } : {}),

      ...(modelNumber !== undefined
        ? { modelNumber }
        : {}),

      ...(sku !== undefined ? { sku } : {}),

      ...(description !== undefined
        ? { description }
        : {}),

      ...(hasOwn(input, "brand")
        ? {
            brand: input.brand
              ? String(input.brand).trim()
              : null,
          }
        : {}),

      ...(hasOwn(input, "headline")
        ? {
            headline: input.headline
              ? String(input.headline).trim()
              : null,
          }
        : {}),

      ...(hasOwn(input, "basePrice")
        ? {
            basePrice: asNonNegativeNumber(
              input.basePrice,
              0
            ),
          }
        : {}),

      ...(hasOwn(input, "discountPercent")
        ? {
            discountPercent: Math.min(
              100,
              Math.max(
                0,
                asFiniteNumber(input.discountPercent, 0)
              )
            ),
          }
        : {}),

      ...(hasOwn(input, "comparePrice")
        ? {
            comparePrice:
              input.comparePrice === null ||
              input.comparePrice === ""
                ? null
                : asNonNegativeNumber(
                    input.comparePrice,
                    0
                  ),
          }
        : {}),

      ...(hasOwn(input, "isFeatured")
        ? { isFeatured: Boolean(input.isFeatured) }
        : {}),

      ...(hasOwn(input, "isNew")
        ? { isNew: Boolean(input.isNew) }
        : {}),

      ...(hasOwn(input, "isPublished")
        ? { isPublished: Boolean(input.isPublished) }
        : {}),

      ...(hasOwn(input, "frameShape")
        ? {
            frameShape: String(
              input.frameShape || "Geometric"
            ),
          }
        : {}),

      ...(hasOwn(input, "frameMaterial")
        ? {
            frameMaterial: String(
              input.frameMaterial || "Grade 5 Titanium"
            ),
          }
        : {}),

      ...(hasOwn(input, "lensMaterial")
        ? {
            lensMaterial: String(
              input.lensMaterial ||
                "Polycarbonate UV400 Polarized"
            ),
          }
        : {}),

      ...(hasOwn(input, "lensWidthMm")
        ? {
            lensWidthMm: Math.trunc(
              asFiniteNumber(input.lensWidthMm, 53)
            ),
          }
        : {}),

      ...(hasOwn(input, "bridgeWidthMm")
        ? {
            bridgeWidthMm: Math.trunc(
              asFiniteNumber(input.bridgeWidthMm, 18)
            ),
          }
        : {}),

      ...(hasOwn(input, "templeLengthMm")
        ? {
            templeLengthMm: Math.trunc(
              asFiniteNumber(input.templeLengthMm, 145)
            ),
          }
        : {}),

      ...(hasOwn(input, "totalWeightG")
        ? {
            totalWeightG: Math.trunc(
              asFiniteNumber(input.totalWeightG, 18)
            ),
          }
        : {}),

      ...(hasOwn(input, "genderStyle")
        ? {
            genderStyle: String(
              input.genderStyle || "Unisex"
            ),
          }
        : {}),

      ...(hasOwn(input, "gsm")
        ? {
            gsm:
              input.gsm === null ||
              input.gsm === ""
                ? null
                : Math.max(
                    0,
                    Math.trunc(
                      asFiniteNumber(input.gsm, 0)
                    )
                  ),
          }
        : {}),

      ...(hasOwn(input, "specifications")
        ? {
            specifications: JSON.stringify(
              parseJsonObject(input.specifications)
            ),
          }
        : {}),

      ...(hasOwn(input, "tags")
        ? {
            tags: JSON.stringify(
              parseStringArray(input.tags)
            ),
          }
        : {}),

      ...(hasOwn(input, "seoTitle")
        ? {
            seoTitle: input.seoTitle
              ? String(input.seoTitle).trim()
              : null,
          }
        : {}),

      ...(hasOwn(input, "seoDescription")
        ? {
            seoDescription: input.seoDescription
              ? String(input.seoDescription).trim()
              : null,
          }
        : {}),

      ...(hasOwn(input, "releaseDate")
        ? { releaseDate: asDate(input.releaseDate) }
        : {}),

      ...(hasOwn(input, "publishedAt")
        ? { publishedAt: asDate(input.publishedAt) }
        : {}),

      /*
       * Keep the legacy single-category relation in sync.
       * The complete category selection is maintained by
       * ProductCategory below.
       */
      ...(categoryIds
        ? { categoryId: categoryIds[0] }
        : {}),
    };

    /* --------------------------------------------------------
       VALIDATE PRICE VALUES
    -------------------------------------------------------- */

    if (
      hasOwn(input, "basePrice") &&
      (!Number.isFinite(Number(input.basePrice)) ||
        Number(input.basePrice) < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid base price." },
        { status: 400 }
      );
    }

    if (
      hasOwn(input, "discountPercent") &&
      (!Number.isFinite(Number(input.discountPercent)) ||
        Number(input.discountPercent) < 0 ||
        Number(input.discountPercent) > 100)
    ) {
      return NextResponse.json(
        {
          error:
            "Discount percentage must be between 0% and 100%.",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       UPDATE PRODUCT AND RELATIONS TRANSACTIONALLY
    -------------------------------------------------------- */

    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        /*
         * Update product details first.
         * Category relations are synchronized in this same
         * transaction, so failures roll back the changes.
         */
        await tx.product.update({
          where: { id },
          data: updateData,
        });

        if (categoryIds) {
          await tx.productCategory.deleteMany({
            where: {
              productId: id,
            },
          });

          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }

        /*
         * Update stock only when the request explicitly
         * contains the stock field.
         */
        if (hasOwn(input, "stock")) {
          const stock = Math.floor(
            asNonNegativeNumber(input.stock, 0)
          );

          const existingInventory =
            await tx.inventory.findUnique({
              where: { productId: id },
              select: {
                reserved: true,
                sold: true,
                lowStockThreshold: true,
              },
            });

          /*
           * Do not set available stock below reserved stock.
           * Reserved inventory may belong to active orders.
           */
          if (
            existingInventory &&
            stock < existingInventory.reserved
          ) {
            throw new Error(
              "STOCK_BELOW_RESERVED: Available stock cannot be lower than currently reserved stock."
            );
          }

          await tx.inventory.upsert({
            where: {
              productId: id,
            },
            create: {
              productId: id,
              available: stock,
              reserved: 0,
              sold: 0,
              lowStockThreshold: hasOwn(
                input,
                "lowStockThreshold"
              )
                ? Math.floor(
                    asNonNegativeNumber(
                      input.lowStockThreshold,
                      10
                    )
                  )
                : 10,
            },
            update: {
              available: stock,
              ...(hasOwn(input, "lowStockThreshold")
                ? {
                    lowStockThreshold: Math.floor(
                      asNonNegativeNumber(
                        input.lowStockThreshold,
                        10
                      )
                    ),
                  }
                : {}),
            },
          });
        } else if (hasOwn(input, "lowStockThreshold")) {
          await tx.inventory.updateMany({
            where: {
              productId: id,
            },
            data: {
              lowStockThreshold: Math.floor(
                asNonNegativeNumber(
                  input.lowStockThreshold,
                  10
                )
              ),
            },
          });
        }

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },

            productCategories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                    showInNavigation: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },

            inventory: true,

            images: {
              orderBy: {
                displayOrder: "asc",
              },
            },

            productVideos: {
              orderBy: {
                displayOrder: "asc",
              },
            },

            glassLinks: {
              include: {
                glass: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
      }
    );

    /* --------------------------------------------------------
       AUDIT LOG
    -------------------------------------------------------- */

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: id,
          details: JSON.stringify({
            changedFields: Object.keys(input),
            previousPublished: existingProduct.isPublished,
            currentPublished: updatedProduct.isPublished,
            categoryIds:
              categoryIds ??
              undefined,
          }),
        },
      })
      .catch((auditError) => {
        console.error(
          "Product update audit log failed:",
          auditError
        );
      });

    return NextResponse.json(
      {
        product: {
          ...updatedProduct,
          categoryIds: Array.from(
            new Set([
              ...(updatedProduct.categoryId
                ? [updatedProduct.categoryId]
                : []),
              ...updatedProduct.productCategories.map(
                (relation) => relation.categoryId
              ),
            ])
          ),
        },
        message: "Product updated successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Admin product PATCH:", error);

    const message =
      error instanceof Error ? error.message : "";

    if (message.startsWith("STOCK_BELOW_RESERVED:")) {
      return NextResponse.json(
        {
          error: message.replace(
            "STOCK_BELOW_RESERVED: ",
            ""
          ),
        },
        { status: 400 }
      );
    }

    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A product with that unique identifier already exists.",
        },
        { status: 409 }
      );
    }

    if (prismaError?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "A selected category or related record is invalid.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — ARCHIVE PRODUCT
   Preserve existing archive behavior.
============================================================ */

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
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

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        modelNumber: true,
        isPublished: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    /*
     * This endpoint archives the product rather than
     * physically deleting it. That protects order history
     * and other records that may reference this product.
     */
    const updated = await prisma.product.update({
      where: { id },
      data: {
        isPublished: false,
      },
      select: {
        id: true,
        name: true,
        modelNumber: true,
        isPublished: true,
      },
    });

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "PRODUCT_ARCHIVED",
          entityType: "Product",
          entityId: id,
          details: JSON.stringify({
            previousPublished: product.isPublished,
          }),
        },
      })
      .catch((auditError) => {
        console.error(
          "Product archive audit log failed:",
          auditError
        );
      });

    return NextResponse.json(
      { product: updated },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin product DELETE:", error);

    return NextResponse.json(
      { error: "Failed to archive product." },
      { status: 500 }
    );
  }
}
