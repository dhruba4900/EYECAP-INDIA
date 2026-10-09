// src/app/api/admin/products/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") {
    return value &&
      typeof value === "object" &&
      !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
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
      return Array.from(
        new Set(
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
    }
  }

  return [];
}

function asDate(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

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

function calculateDiscountedPrice(
  price: number,
  discountPercent: number
): number {
  const safeDiscount = Math.min(
    100,
    Math.max(0, discountPercent)
  );

  return (
    Math.round(
      (price * (1 - safeDiscount / 100) + Number.EPSILON) *
        100
    ) / 100
  );
}

function getUniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

/* =========================================================
   GET — ADMIN PRODUCT CATALOGUE
========================================================= */

export async function GET(request: Request) {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() || "";

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                modelNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                sku: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        // Legacy single-category relation is retained.
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        // New multiple-category relation.
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

        images: {
          orderBy: {
            displayOrder: "asc",
          },
          select: {
            id: true,
            url: true,
            isPrimary: true,
            displayOrder: true,
          },
        },

        productVideos: {
          orderBy: {
            displayOrder: "asc",
          },
          select: {
            id: true,
            url: true,
            posterUrl: true,
            title: true,
            displayOrder: true,
            isBackground: true,
            autoplay: true,
            loop: true,
            muted: true,
          },
        },

        inventory: {
          select: {
            available: true,
            reserved: true,
            sold: true,
            lowStockThreshold: true,
          },
        },

        glassLinks: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            glass: true,
          },
        },
      },
    });

    const formattedProducts = products.map((product) => {
      const originalPrice = Number(product.basePrice);

      const discountPercent = Math.min(
        100,
        Math.max(0, Number(product.discountPercent || 0))
      );

      const discountedPrice = calculateDiscountedPrice(
        originalPrice,
        discountPercent
      );

      // Provide a simple categoryIds array for the admin UI.
      const categoryIds = Array.from(
        new Set([
          ...(product.categoryId ? [product.categoryId] : []),
          ...product.productCategories.map(
            (relation) => relation.categoryId
          ),
        ])
      );

      return {
        ...product,
        categoryIds,
        pricing: {
          currency: "INR",
          currencySymbol: "₹",
          originalPrice,
          discountPercent,
          discountedPrice,
        },
      };
    });

    return NextResponse.json(
      {
        products: formattedProducts,
        currency: {
          code: "INR",
          symbol: "₹",
          locale: "en-IN",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin products GET:", error);

    return NextResponse.json(
      {
        error: "Failed to load products.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST — CREATE PRODUCT WITH MULTIPLE CATEGORIES
========================================================= */

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();

    /* -----------------------------------------------------
       BASIC PRODUCT DATA
    ----------------------------------------------------- */

    const name = String(body.name || "").trim();

    const modelNumber = String(body.modelNumber || "")
      .trim()
      .toUpperCase();

    const sku = String(body.sku || "")
      .trim()
      .toUpperCase();

    const description = String(body.description || "").trim();

    const brand = body.brand
      ? String(body.brand).trim()
      : null;

    /*
     * Multi-category support:
     * The updated admin form sends categoryIds: string[].
     *
     * categoryId is still accepted for compatibility with
     * older clients and existing database relationships.
     */
    const submittedCategoryIds = getUniqueIds(body.categoryIds);

    const legacyCategoryId = String(
      body.categoryId || ""
    ).trim();

    const categoryIds = Array.from(
      new Set([
        ...submittedCategoryIds,
        ...(legacyCategoryId ? [legacyCategoryId] : []),
      ])
    );

    /*
     * Keep the first selected category in the legacy
     * Product.categoryId field.
     *
     * The full selection will also be saved in
     * ProductCategory below.
     */
    const categoryId = categoryIds[0] || "";

    /* -----------------------------------------------------
       PRICE
    ----------------------------------------------------- */

    const basePrice = asNonNegativeNumber(body.basePrice, 0);

    const discountPercent = Math.min(
      100,
      Math.max(0, asFiniteNumber(body.discountPercent, 0))
    );

    const discountedPrice = calculateDiscountedPrice(
      basePrice,
      discountPercent
    );

    let comparePrice: number | null = null;

    if (
      body.comparePrice !== null &&
      body.comparePrice !== undefined &&
      body.comparePrice !== ""
    ) {
      comparePrice = asNonNegativeNumber(
        body.comparePrice,
        0
      );
    }

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!name || !modelNumber || !sku || !description) {
      return NextResponse.json(
        {
          error:
            "Name, model number, SKU and description are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (categoryIds.length === 0) {
      return NextResponse.json(
        {
          error: "Select at least one product category.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json(
        {
          error: "Invalid base price.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Discount percentage must be between 0% and 100%.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       VALIDATE ALL SELECTED CATEGORIES
    ----------------------------------------------------- */

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    /*
     * Reject the request if any selected category does not
     * exist or has been deactivated.
     *
     * This prevents invalid ProductCategory references.
     */
    if (categories.length !== categoryIds.length) {
      const foundIds = new Set(
        categories.map((category) => category.id)
      );

      const invalidCategoryIds = categoryIds.filter(
        (id) => !foundIds.has(id)
      );

      return NextResponse.json(
        {
          error:
            "One or more selected categories do not exist or are inactive.",
          invalidCategoryIds,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       UNIQUE MODEL NUMBER / SKU
    ----------------------------------------------------- */

    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          {
            modelNumber,
          },
          {
            sku,
          },
        ],
      },
      select: {
        modelNumber: true,
        sku: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            existing.modelNumber === modelNumber
              ? "Model number already exists."
              : "SKU already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       GENERATE UNIQUE SLUG
    ----------------------------------------------------- */

    let slug = slugify(name);

    if (!slug) {
      slug = `product-${modelNumber.toLowerCase()}`;
    }

    const slugOwner = await prisma.product.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (slugOwner) {
      const modelSlug = modelNumber
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      slug = `${slug}-${modelSlug}`;
    }

    /*
     * A second collision check is still handled by Prisma's
     * unique-constraint error handler below.
     */

    /* -----------------------------------------------------
       TAGS / SPECIFICATIONS
    ----------------------------------------------------- */

    const tags = parseStringArray(body.tags);

    const specifications = parseJsonObject(
      body.specifications
    );

    /* -----------------------------------------------------
       INVENTORY
    ----------------------------------------------------- */

    const stock = Math.floor(
      asNonNegativeNumber(body.stock, 0)
    );

    const lowStockThreshold = Math.floor(
      asNonNegativeNumber(body.lowStockThreshold, 10)
    );

    /* -----------------------------------------------------
       MEDIA INPUT
    ----------------------------------------------------- */

    const productImages: unknown[] = Array.isArray(body.images)
      ? body.images
      : [];

    const productVideos: unknown[] = Array.isArray(
      body.productVideos
    )
      ? body.productVideos
      : Array.isArray(body.videos)
        ? body.videos
        : [];

    /* -----------------------------------------------------
       GLASS CONFIGURATION
    ----------------------------------------------------- */

    const glassOptionIds = getUniqueIds(body.glassOptionIds);

    /* -----------------------------------------------------
       CREATE PRODUCT AND RELATIONS TRANSACTIONALLY
    ----------------------------------------------------- */

    const result = await prisma.$transaction(async (tx) => {
      /* -----------------------------------------------
         1. CREATE PRODUCT
      ----------------------------------------------- */

      const product = await tx.product.create({
        data: {
          name,
          modelNumber,
          brand,
          slug,

          headline: body.headline
            ? String(body.headline).trim()
            : null,

          description,
          basePrice,
          discountPercent,
          comparePrice,
          sku,

          /*
           * Legacy relation:
           * Keep this field populated for older parts of
           * the storefront that still use categoryId.
           */
          categoryId,

          isFeatured: Boolean(body.isFeatured),
          isNew: Boolean(body.isNew),
          isPublished: Boolean(body.isPublished),

          frameShape: String(
            body.frameShape || "Geometric"
          ),

          frameMaterial: String(
            body.frameMaterial || "Grade 5 Titanium"
          ),

          lensMaterial: String(
            body.lensMaterial ||
              "Polycarbonate UV400 Polarized"
          ),

          lensWidthMm: asFiniteNumber(
            body.lensWidthMm,
            53
          ),

          bridgeWidthMm: asFiniteNumber(
            body.bridgeWidthMm,
            18
          ),

          templeLengthMm: asFiniteNumber(
            body.templeLengthMm,
            145
          ),

          totalWeightG: asFiniteNumber(
            body.totalWeightG,
            18
          ),

          genderStyle: String(
            body.genderStyle || "Unisex"
          ),

          gsm:
            body.gsm === null ||
            body.gsm === undefined ||
            body.gsm === ""
              ? null
              : Math.max(
                  0,
                  Math.floor(
                    asFiniteNumber(body.gsm, 0)
                  )
                ),

          specifications: JSON.stringify(specifications),
          tags: JSON.stringify(tags),

          seoTitle: body.seoTitle
            ? String(body.seoTitle).trim()
            : null,

          seoDescription: body.seoDescription
            ? String(body.seoDescription).trim()
            : null,

          releaseDate: asDate(body.releaseDate),
          publishedAt: asDate(body.publishedAt),

          inventory: {
            create: {
              available: stock,
              reserved: 0,
              sold: 0,
              lowStockThreshold,
            },
          },
        },

        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },

          inventory: true,
        },
      });

      /* -----------------------------------------------
         2. SAVE MULTIPLE CATEGORY RELATIONS
      ----------------------------------------------- */

      /*
       * This is the main change.
       *
       * Every selected category gets a ProductCategory
       * relation. The unique constraint on
       * (productId, categoryId) prevents duplicate pairs.
       *
       * The product and category relations are saved inside
       * the same transaction as the product itself.
       */

      await tx.productCategory.createMany({
        data: categoryIds.map((selectedCategoryId) => ({
          productId: product.id,
          categoryId: selectedCategoryId,
        })),
        skipDuplicates: true,
      });

      /* -----------------------------------------------
         3. SAVE GLASS OPTION LINKS
      ----------------------------------------------- */

      if (glassOptionIds.length > 0) {
        const validGlasses = await tx.glassOption.findMany({
          where: {
            id: {
              in: glassOptionIds,
            },
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (validGlasses.length > 0) {
          await tx.productGlass.createMany({
            data: validGlasses.map(
              (glass: { id: string }, index: number) => ({
                productId: product.id,
                glassId: glass.id,
                isDefault: index === 0,
              })
            ),
            skipDuplicates: true,
          });
        }
      }

      /* -----------------------------------------------
         4. SAVE PRODUCT VIDEOS
      ----------------------------------------------- */

      const videoData = productVideos
        .map((video: unknown, index: number) => {
          if (
            typeof video === "string" &&
            video.trim()
          ) {
            return {
              productId: product.id,
              url: video.trim(),
              displayOrder: index,
              isBackground: index === 0,
              autoplay: true,
              loop: true,
              muted: true,
            };
          }

          if (
            video &&
            typeof video === "object"
          ) {
            const item = video as Record<string, unknown>;

            const videoUrl = String(
              item.url || ""
            ).trim();

            if (!videoUrl) {
              return null;
            }

            const suppliedDisplayOrder = Number(
              item.displayOrder
            );

            return {
              productId: product.id,
              url: videoUrl,

              posterUrl: item.posterUrl
                ? String(item.posterUrl).trim()
                : null,

              title: item.title
                ? String(item.title).trim()
                : null,

              displayOrder: Number.isFinite(
                suppliedDisplayOrder
              )
                ? suppliedDisplayOrder
                : index,

              isBackground:
                item.isBackground === undefined
                  ? index === 0
                  : Boolean(item.isBackground),

              autoplay:
                item.autoplay === undefined
                  ? true
                  : Boolean(item.autoplay),

              loop:
                item.loop === undefined
                  ? true
                  : Boolean(item.loop),

              muted:
                item.muted === undefined
                  ? true
                  : Boolean(item.muted),
            };
          }

          return null;
        })
        .filter(
          (
            item
          ): item is NonNullable<typeof item> =>
            item !== null
        );

      if (videoData.length > 0) {
        await tx.productVideo.createMany({
          data: videoData,
        });
      }

      /* -----------------------------------------------
         5. SAVE PRODUCT IMAGES
      ----------------------------------------------- */

      if (productImages.length > 0) {
        const imageData = productImages
          .map((image: unknown, index: number) => {
            if (
              typeof image === "string" &&
              image.trim()
            ) {
              return {
                productId: product.id,
                url: image.trim(),
                displayOrder: index,
                isPrimary: index === 0,
              };
            }

            if (
              image &&
              typeof image === "object"
            ) {
              const item = image as Record<string, unknown>;

              const imageUrl = String(
                item.url || ""
              ).trim();

              if (!imageUrl) {
                return null;
              }

              const suppliedDisplayOrder = Number(
                item.displayOrder
              );

              return {
                productId: product.id,
                url: imageUrl,

                displayOrder: Number.isFinite(
                  suppliedDisplayOrder
                )
                  ? suppliedDisplayOrder
                  : index,

                isPrimary:
                  item.isPrimary === undefined
                    ? index === 0
                    : Boolean(item.isPrimary),
              };
            }

            return null;
          })
          .filter(
            (
              item
            ): item is NonNullable<typeof item> =>
              item !== null
          );

        if (imageData.length > 0) {
          await tx.productImage.createMany({
            data: imageData,
          });
        }
      }

      /* -----------------------------------------------
         6. RETURN CREATED PRODUCT
      ----------------------------------------------- */

      return product;
    });

    /* -----------------------------------------------------
       AUDIT LOG
    ----------------------------------------------------- */

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: result.id,

          details: JSON.stringify({
            modelNumber,
            sku,
            basePrice,
            discountPercent,
            discountedPrice,
            currency: "INR",
            currencySymbol: "₹",
            stock,
            categoryIds,
            glassOptionIds,
            imageCount: productImages.length,
            videoCount: productVideos.length,
          }),
        },
      })
      .catch((auditError) => {
        console.error(
          "Product audit log failed:",
          auditError
        );
      });

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return NextResponse.json(
      {
        product: {
          ...result,
          categoryIds,
        },

        pricing: {
          currency: "INR",
          currencySymbol: "₹",
          locale: "en-IN",
          originalPrice: basePrice,
          discountPercent,
          discountedPrice,
        },

        message: "Product created successfully.",
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Admin products POST:", error);

    const prismaError = error as {
      code?: string;
    };

    if (prismaError?.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A product with that unique identifier already exists.",
        },
        {
          status: 409,
        }
      );
    }

    if (prismaError?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "One of the selected references is invalid. Please check category or glass selection.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create product.",
        // Keep technical details in server logs, not the API
        // response sent to the browser.
      },
      {
        status: 500,
      }
    );
  }
}