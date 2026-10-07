import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const value =
      searchParams.get("value")?.trim() ||
      searchParams.get("trackingNumber")?.trim() ||
      searchParams.get("serialNumber")?.trim();

    if (!value) {
      return NextResponse.json(
        {
          success: false,
          error: "Product tracking number or serial number is required.",
        },
        { status: 400 }
      );
    }

    const productUnit = await prisma.productUnit.findFirst({
      where: {
        OR: [
          {
            trackingNumber: value,
          },
          {
            serialNumber: value,
          },
        ],
      },

      include: {
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            headline: true,
            description: true,
            sku: true,
            frameShape: true,
            frameMaterial: true,
            lensMaterial: true,
            lensWidthMm: true,
            bridgeWidthMm: true,
            templeLengthMm: true,
            totalWeightG: true,
            genderStyle: true,
            releaseDate: true,
          },
        },

        ProductVariant: {
          select: {
            id: true,
            name: true,
            colorName: true,
            colorHex: true,
            size: true,
            sku: true,
          },
        },

        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            createdAt: true,

            delivery: {
              select: {
                id: true,
                trackingNumber: true,
                status: true,
                acceptedAt: true,
                pickedUpAt: true,
                outForDeliveryAt: true,
                deliveredAt: true,
              },
            },
          },
        },

        User: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!productUnit) {
      return NextResponse.json(
        {
          success: false,
          error: "No product found with this tracking or serial number.",
        },
        { status: 404 }
      );
    }

    /*
     * PUBLIC PRIVACY RULE
     *
     * Owner information is deliberately masked.
     * Full customer information must NEVER be returned
     * from this public endpoint.
     */

    const ownerName = productUnit.User
      ? `${productUnit.User.firstName?.charAt(0) || ""}****** ${
          productUnit.User.lastName?.charAt(0) || ""
        }********`
      : null;

    return NextResponse.json({
      success: true,

      product: {
        trackingNumber: productUnit.trackingNumber,
        serialNumber: productUnit.serialNumber,

        status: productUnit.status,

        manufacturedAt: productUnit.manufacturedAt,
        purchasedAt: productUnit.purchasedAt,
        deliveredAt: productUnit.deliveredAt,
        warrantyUntil: productUnit.warrantyUntil,

        model: {
          name: productUnit.Product.name,
          modelNumber: productUnit.Product.sku,
          slug: productUnit.Product.slug,
          headline: productUnit.Product.headline,
          description: productUnit.Product.description,

          releaseDate: productUnit.Product.releaseDate,

          specifications: {
            frameShape: productUnit.Product.frameShape,
            frameMaterial: productUnit.Product.frameMaterial,
            lensMaterial: productUnit.Product.lensMaterial,
            lensWidthMm: productUnit.Product.lensWidthMm,
            bridgeWidthMm: productUnit.Product.bridgeWidthMm,
            templeLengthMm: productUnit.Product.templeLengthMm,
            totalWeightG: productUnit.Product.totalWeightG,
            genderStyle: productUnit.Product.genderStyle,
          },
        },

        variant: productUnit.ProductVariant
          ? {
              name: productUnit.ProductVariant.name,
              colorName: productUnit.ProductVariant.colorName,
              colorHex: productUnit.ProductVariant.colorHex,
              size: productUnit.ProductVariant.size,
              sku: productUnit.ProductVariant.sku,
            }
          : null,

        owner: ownerName
          ? {
              displayName: ownerName,
            }
          : null,

        order: productUnit.Order
          ? {
              orderNumber: productUnit.Order.orderNumber,
              status: productUnit.Order.status,
              paymentStatus: productUnit.Order.paymentStatus,
              purchasedAt: productUnit.purchasedAt,
              createdAt: productUnit.Order.createdAt,

              delivery: productUnit.Order.delivery
                ? {
                    trackingNumber:
                      productUnit.Order.delivery.trackingNumber,
                    status: productUnit.Order.delivery.status,
                    acceptedAt: productUnit.Order.delivery.acceptedAt,
                    pickedUpAt: productUnit.Order.delivery.pickedUpAt,
                    outForDeliveryAt:
                      productUnit.Order.delivery.outForDeliveryAt,
                    deliveredAt: productUnit.Order.delivery.deliveredAt,
                  }
                : null,
            }
          : null,

        warranty: {
          status: getWarrantyStatus(productUnit.warrantyUntil),
          expiresAt: productUnit.warrantyUntil,
          renewable: Boolean(productUnit.warrantyUntil),
        },
      },
    });
  } catch (error) {
    console.error("[PRODUCT_TRACKING]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve product information.",
      },
      { status: 500 }
    );
  }
}

function getWarrantyStatus(warrantyUntil: Date | null) {
  if (!warrantyUntil) {
    return "NOT_AVAILABLE";
  }

  return warrantyUntil.getTime() >= Date.now() ? "ACTIVE" : "EXPIRED";
}