import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  try {
    const parsed = JSON.parse(value);

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
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

function asDate(value: unknown) {
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
) {
  const safeDiscount = Math.min(
    100,
    Math.max(0, discountPercent)
  );

  return Math.round(
    (price * (1 - safeDiscount / 100) + Number.EPSILON) * 100
  ) / 100;
}

/**
 * GET
 * Admin product catalogue
 */
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
    const search =
      url.searchParams.get("search")?.trim() || "";

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
        category: {
          select: {
            id: true,
            name: true,
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

    /**
     * Keep the database price numeric.
     *
     * Currency formatting such as ₹ should be handled
     * by the UI. This keeps calculations safe.
     */
    const formattedProducts = products.map((product) => {
      const originalPrice = Number(product.basePrice);
      const discountPercent = Math.min(
        100,
        Math.max(0, Number(product.discountPercent || 0))
      );

      const discountedPrice =
        calculateDiscountedPrice(
          originalPrice,
          discountPercent
        );

      return {
        ...product,
        pricing: {
          currency: "INR",
          currencySymbol: "₹",
          originalPrice,
          discountPercent,
          discountedPrice,
        },
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      currency: {
        code: "INR",
        symbol: "₹",
        locale: "en-IN",
      },
    });
  } catch (error) {
    console.error(
      "Admin products GET:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load products",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST
 * Create new product
 */
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

    /* -----------------------------------------
       BASIC PRODUCT DATA
    ----------------------------------------- */

    const name =
      String(body.name || "").trim();

    const modelNumber =
      String(body.modelNumber || "")
        .trim()
        .toUpperCase();

    const sku =
      String(body.sku || "")
        .trim()
        .toUpperCase();

    const description =
      String(body.description || "").trim();

    const categoryId =
      String(body.categoryId || "").trim();

    const brand =
      body.brand
        ? String(body.brand).trim()
        : null;

    /* -----------------------------------------
       PRICE
       INR / ₹
    ----------------------------------------- */

    const basePrice =
      asNonNegativeNumber(body.basePrice, 0);

    const discountPercent = Math.min(
      100,
      Math.max(
        0,
        asFiniteNumber(
          body.discountPercent,
          0
        )
      )
    );

    const discountedPrice =
      calculateDiscountedPrice(
        basePrice,
        discountPercent
      );

    let comparePrice: number | null = null;

    if (
      body.comparePrice !== null &&
      body.comparePrice !== undefined &&
      body.comparePrice !== ""
    ) {
      comparePrice =
        asNonNegativeNumber(
          body.comparePrice,
          0
        );
    }

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (
      !name ||
      !modelNumber ||
      !sku ||
      !description ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Name, model number, SKU, description and category are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(basePrice) ||
      basePrice < 0
    ) {
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

    /* -----------------------------------------
       CATEGORY
    ----------------------------------------- */

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
          name: true,
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       UNIQUE MODEL / SKU
    ----------------------------------------- */

    const existing =
      await prisma.product.findFirst({
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

    /* -----------------------------------------
       SLUG
    ----------------------------------------- */

    let slug = slugify(name);

    if (!slug) {
      slug = `product-${modelNumber.toLowerCase()}`;
    }

    const slugOwner =
      await prisma.product.findUnique({
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
        .replace(/[^a-z0-9]+/g, "-");

      slug = `${slug}-${modelSlug}`;
    }

    /* -----------------------------------------
       TAGS / SPECIFICATIONS
    ----------------------------------------- */

    const tags =
      parseStringArray(body.tags);

    const specifications =
      parseJsonObject(
        body.specifications
      );

    /* -----------------------------------------
       STOCK
    ----------------------------------------- */

    const stock =
      Math.floor(
        asNonNegativeNumber(
          body.stock,
          0
        )
      );

    const lowStockThreshold =
      Math.floor(
        asNonNegativeNumber(
          body.lowStockThreshold,
          10
        )
      );

    /* -----------------------------------------
       MEDIA DATA
       Supports URLs sent by the current
       admin UI/API. Actual file-upload
       storage can be connected later.
    ----------------------------------------- */

    const productImages: unknown[] =
      Array.isArray(body.images)
        ? body.images
        : [];

    const productVideos: unknown[] =
      Array.isArray(body.productVideos)
        ? body.productVideos
        : Array.isArray(body.videos)
        ? body.videos
        : [];

    /* -----------------------------------------
       GLASS CONFIGURATION
    ----------------------------------------- */

    const glassOptionIds =
      Array.isArray(body.glassOptionIds)
        ? body.glassOptionIds
            .map((value: unknown) =>
              String(value).trim()
            )
            .filter(Boolean)
        : [];

    /* -----------------------------------------
       CREATE PRODUCT
       Transaction prevents partially-created
       product records.
    ----------------------------------------- */

    const result =
      await prisma.$transaction(
        async (tx) => {
          const product =
            await tx.product.create({
              data: {
                name,
                modelNumber,

                brand,

                slug,

                headline:
                  body.headline
                    ? String(
                        body.headline
                      ).trim()
                    : null,

                description,

                basePrice,

                discountPercent,

                comparePrice,

                sku,

                categoryId,

                isFeatured:
                  Boolean(
                    body.isFeatured
                  ),

                isNew:
                  Boolean(
                    body.isNew
                  ),

                isPublished:
                  Boolean(
                    body.isPublished
                  ),

                frameShape:
                  String(
                    body.frameShape ||
                      "Geometric"
                  ),

                frameMaterial:
                  String(
                    body.frameMaterial ||
                      "Grade 5 Titanium"
                  ),

                lensMaterial:
                  String(
                    body.lensMaterial ||
                      "Polycarbonate UV400 Polarized"
                  ),

                lensWidthMm:
                  asFiniteNumber(
                    body.lensWidthMm,
                    53
                  ),

                bridgeWidthMm:
                  asFiniteNumber(
                    body.bridgeWidthMm,
                    18
                  ),

                templeLengthMm:
                  asFiniteNumber(
                    body.templeLengthMm,
                    145
                  ),

                totalWeightG:
                  asFiniteNumber(
                    body.totalWeightG,
                    18
                  ),

                genderStyle:
                  String(
                    body.genderStyle ||
                      "Unisex"
                  ),

                gsm:
                  body.gsm === null ||
                  body.gsm === undefined ||
                  body.gsm === ""
                    ? null
                    : Math.max(
                        0,
                        Math.floor(
                          asFiniteNumber(
                            body.gsm,
                            0
                          )
                        )
                      ),

                specifications:
                  JSON.stringify(
                    specifications
                  ),

                tags:
                  JSON.stringify(tags),

                seoTitle:
                  body.seoTitle
                    ? String(
                        body.seoTitle
                      ).trim()
                    : null,

                seoDescription:
                  body.seoDescription
                    ? String(
                        body.seoDescription
                      ).trim()
                    : null,

                releaseDate:
                  asDate(
                    body.releaseDate
                  ),

                publishedAt:
                  asDate(
                    body.publishedAt
                  ),

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
                  },
                },

                inventory: true,
              },
            });

          /* -------------------------------------
             GLASS LINKS
          ------------------------------------- */

          if (
            glassOptionIds.length
          ) {
            const validGlasses =
              await tx.glassOption.findMany(
                {
                  where: {
                    id: {
                      in: glassOptionIds,
                    },

                    isActive: true,
                  },

                  select: {
                    id: true,
                  },
                }
              );

            if (
              validGlasses.length
            ) {
              await tx.productGlass.createMany(
                {
                  data:
                    validGlasses.map(
                      (
                        glass: { id: string },
                        index: number
                      ) => ({
                        productId:
                          product.id,

                        glassId:
                          glass.id,

                        isDefault:
                          index === 0,
                      })
                    ),

                  skipDuplicates:
                    true,
                }
              );
            }
          }

          /* -------------------------------------
             PRODUCT VIDEOS
          ------------------------------------- */

 const videoData = productVideos
  .map(
    (
      video: unknown,
      index: number
    ) => {
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
        const item = video as Record<
          string,
          unknown
        >;

        const url = String(
          item.url || ""
        ).trim();

        if (!url) {
          return null;
        }

        return {
          productId: product.id,
          url,

          posterUrl: item.posterUrl
            ? String(item.posterUrl).trim()
            : null,

          title: item.title
            ? String(item.title).trim()
            : null,

          displayOrder: Number.isFinite(
            Number(item.displayOrder)
          )
            ? Number(item.displayOrder)
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
    }
  )
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
          /* -------------------------------------
             PRODUCT IMAGES
             
             Only create image records when
             the current Prisma ProductImage
             relation accepts the expected
             fields.
          ------------------------------------- */

          if (
            productImages.length
          ) {
            const imageData =
              productImages
                .map(
                  (
                    image: unknown,
                    index: number
                  ) => {
                    if (
                      typeof image ===
                        "string" &&
                      image.trim()
                    ) {
                      return {
                        productId:
                          product.id,

                        url: image.trim(),

                        displayOrder:
                          index,

                        isPrimary:
                          index === 0,
                      };
                    }

                    if (
                      image &&
                      typeof image ===
                        "object"
                    ) {
                      const item =
                        image as Record<
                          string,
                          unknown
                        >;

                      const url =
                        String(
                          item.url ||
                            ""
                        ).trim();

                      if (!url) {
                        return null;
                      }

                      return {
                        productId:
                          product.id,

                        url,

                        displayOrder:
                          Number.isFinite(
                            Number(
                              item.displayOrder
                            )
                          )
                            ? Number(
                                item.displayOrder
                              )
                            : index,

                        isPrimary:
                          item.isPrimary ===
                          undefined
                            ? index === 0
                            : Boolean(
                                item.isPrimary
                              ),
                      };
                    }

                    return null;
                  }
                )
                .filter(
                  (
                    item
                  ): item is NonNullable<
                    typeof item
                  > => item !== null
                );

            if (
              imageData.length
            ) {
              await tx.productImage.createMany(
                {
                  data: imageData,
                }
              );
            }
          }

          return product;
        }
      );

    /* -----------------------------------------
       AUDIT
    ----------------------------------------- */

    await prisma.auditLog
      .create({
        data: {
          actorId: auth.user.id,

          action:
            "PRODUCT_CREATED",

          entityType:
            "Product",

          entityId:
            result.id,

          details:
            JSON.stringify({
              modelNumber,
              sku,
              basePrice,
              discountPercent,
              discountedPrice,
              currency: "INR",
              currencySymbol: "₹",
              stock,
              glassOptionIds,
              imageCount:
                productImages.length,
              videoCount:
                productVideos.length,
            }),
        },
      })
      .catch((auditError) => {
        console.error(
          "Product audit log failed:",
          auditError
        );
      });

    /* -----------------------------------------
       RESPONSE
    ----------------------------------------- */

    return NextResponse.json(
      {
        product: result,

        pricing: {
          currency: "INR",
          currencySymbol: "₹",
          locale: "en-IN",
          originalPrice: basePrice,
          discountPercent,
          discountedPrice,
        },

        message:
          "Product created successfully.",
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "Admin products POST:",
      error
    );

    if (
      error?.code === "P2002"
    ) {
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

    if (
      error?.code === "P2003"
    ) {
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
        error:
          "Failed to create product.",
      },
      {
        status: 500,
      }
    );
  }
}