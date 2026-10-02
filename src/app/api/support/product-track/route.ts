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
        product: {
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

        variant: {
          select: {
            id: true,
            name: true,
            colorName: true,
            colorHex: true,
            size: true,
            sku: true,
          },
        },

        order: {
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

        owner: {
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

    const ownerName = productUnit.owner
      ? `${productUnit.owner.firstName?.charAt(0) || ""}****** ${
          productUnit.owner.lastName?.charAt(0) || ""
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
          name: productUnit.product.name,
          modelNumber: productUnit.product.sku,
          slug: productUnit.product.slug,
          headline: productUnit.product.headline,
          description: productUnit.product.description,

          releaseDate: productUnit.product.releaseDate,

          specifications: {
            frameShape: productUnit.product.frameShape,
            frameMaterial: productUnit.product.frameMaterial,
            lensMaterial: productUnit.product.lensMaterial,
            lensWidthMm: productUnit.product.lensWidthMm,
            bridgeWidthMm: productUnit.product.bridgeWidthMm,
            templeLengthMm: productUnit.product.templeLengthMm,
            totalWeightG: productUnit.product.totalWeightG,
            genderStyle: productUnit.product.genderStyle,
          },
        },

        variant: productUnit.variant
          ? {
              name: productUnit.variant.name,
              colorName: productUnit.variant.colorName,
              colorHex: productUnit.variant.colorHex,
              size: productUnit.variant.size,
              sku: productUnit.variant.sku,
            }
          : null,

        owner: ownerName
          ? {
              displayName: ownerName,
            }
          : null,

        order: productUnit.order
          ? {
              orderNumber: productUnit.order.orderNumber,
              status: productUnit.order.status,
              paymentStatus: productUnit.order.paymentStatus,
              purchasedAt: productUnit.purchasedAt,
              createdAt: productUnit.order.createdAt,

              delivery: productUnit.order.delivery
                ? {
                    trackingNumber:
                      productUnit.order.delivery.trackingNumber,
                    status: productUnit.order.delivery.status,
                    acceptedAt: productUnit.order.delivery.acceptedAt,
                    pickedUpAt: productUnit.order.delivery.pickedUpAt,
                    outForDeliveryAt:
                      productUnit.order.delivery.outForDeliveryAt,
                    deliveredAt: productUnit.order.delivery.deliveredAt,
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