import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ items: [], subtotal: 0, total: 0 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
                inventory: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], subtotal: 0, total: 0 });
    }

    const formattedItems = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      slug: item.product.slug,
      variantName: item.variant?.name || "Standard",
      colorHex: item.variant?.colorHex || "#111827",
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      imageUrl: item.variant?.imageUrl || item.product.images[0]?.url || "",
      availableStock: item.product.inventory?.available || 0,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const subtotal = formattedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    return NextResponse.json({
      id: cart.id,
      items: formattedItems,
      subtotal,
      total: subtotal,
    });
  } catch (error: any) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to add items to your cart" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify product & inventory server-side
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
        variants: true,
      },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json({ error: "Product is not available" }, { status: 404 });
    }

    const selectedVariant = variantId
      ? product.variants.find((v) => v.id === variantId)
      : product.variants[0];

    const availableStock = product.inventory?.available || 0;
    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Only ${availableStock} units available in stock` },
        { status: 400 }
      );
    }

    const unitPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);

    // Find or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: selectedVariant?.id || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > availableStock) {
        return NextResponse.json(
          { error: `Cannot add more. Reached max available stock of ${availableStock}` },
          { status: 400 }
        );
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: selectedVariant?.id || null,
          quantity,
          unitPrice,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Added to cart" });
  } catch (error: any) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const clearAll = searchParams.get("clear") === "true";

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json({ success: true });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      return NextResponse.json({ success: true, message: "Cart cleared" });
    }

    if (itemId) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
      return NextResponse.json({ success: true, message: "Item removed" });
    }

    return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
