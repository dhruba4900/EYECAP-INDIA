import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { frameMaterial: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        inventory: true,
        variants: true,
        images: { take: 1 },
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch admin products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      name,
      headline,
      description,
      basePrice,
      comparePrice,
      sku,
      categoryId,
      frameShape,
      frameMaterial,
      lensMaterial,
      stock = 50,
      imageUrl,
      modelType = "geometric",
      lensColor = "#0F172A",
      frameColor = "#334155",
    } = body;

    if (!name || !sku || !basePrice || !categoryId) {
      return NextResponse.json(
        { error: "Name, SKU, Base Price, and Category are required" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        headline,
        description: description || "Handcrafted premium eyewear.",
        basePrice: parseFloat(basePrice),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku,
        categoryId,
        frameShape: frameShape || "Geometric",
        frameMaterial: frameMaterial || "Grade 5 Titanium",
        lensMaterial: lensMaterial || "Zeiss UV400 Polarized",
        isPublished: true,
        inventory: {
          create: {
            available: parseInt(stock, 10) || 50,
            reserved: 0,
            sold: 0,
            lowStockThreshold: 10,
          },
        },
        images: imageUrl
          ? {
              create: [
                {
                  url: imageUrl,
                  alt: name,
                  displayOrder: 0,
                  isPrimary: true,
                },
              ],
            }
          : undefined,
        model3d: {
          create: {
            posterUrl: imageUrl || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
            modelType,
            lensColor,
            frameColor,
            metalness: 0.9,
            roughness: 0.2,
            transmission: 0.6,
          },
        },
        variants: {
          create: [
            {
              name: "Standard Edition",
              colorName: "Matte Black",
              colorHex: "#111827",
              size: "Standard",
              sku: `${sku}-STD`,
              priceAdjustment: 0,
              imageUrl,
            },
          ],
        },
      },
      include: {
        inventory: true,
        category: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: newProduct.id,
        details: JSON.stringify({ name, sku, basePrice }),
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
