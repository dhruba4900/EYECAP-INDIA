import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateOrderNumber, generateDeliveryOTP } from "@/lib/utils";
import { z } from "zod";

const orderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, "Full name required"),
    phone: z.string().min(1, "Phone number required"),
    street: z.string().min(1, "Street address required"),
    apartment: z.string().optional(),
    city: z.string().min(1, "City required"),
    state: z.string().min(1, "State required"),
    postalCode: z.string().min(1, "Postal code required"),
    country: z.string().default("United States"),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "At least one item required"),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to complete your order" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { shippingAddress, items, paymentMethod, couponCode, notes } = parsed.data;

    // 1. Validate all products and fetch real prices & inventory directly from database
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
      include: {
        variants: true,
        inventory: true,
        images: { take: 1 },
      },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products in your cart are no longer available" },
        { status: 400 }
      );
    }

    // Check inventory availability for all items
    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.productId);
      const stock = dbProd?.inventory?.available || 0;
      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ${dbProd?.name}. Only ${stock} left.` },
          { status: 400 }
        );
      }
    }

    // 2. Compute accurate subtotal on server
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const dbProd = dbProducts.find((p) => p.id === item.productId)!;
      const variant = item.variantId
        ? dbProd.variants.find((v) => v.id === item.variantId)
        : dbProd.variants[0];

      const unitPrice = dbProd.basePrice + (variant?.priceAdjustment || 0);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      return {
        productId: dbProd.id,
        variantId: variant?.id || null,
        productName: dbProd.name,
        variantName: variant?.name || "Standard",
        colorHex: variant?.colorHex || "#111827",
        sku: variant?.sku || dbProd.sku,
        unitPrice,
        quantity: item.quantity,
        totalPrice,
      };
    });

    // 3. Validate coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (coupon && (!coupon.validUntil || new Date(coupon.validUntil) >= new Date())) {
        if (subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === "PERCENT") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
          // Increment coupon usage
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    const tax = Number(((subtotal - discount) * 0.08).toFixed(2));
    const shippingFee = subtotal > 300 ? 0.0 : 15.0;
    const total = Number((subtotal - discount + tax + shippingFee).toFixed(2));

    const orderNumber = generateOrderNumber();
    const deliveryOtp = generateDeliveryOTP();

    // 4. Create or reuse address
    const savedAddress = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        apartment: shippingAddress.apartment,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        type: "HOME",
      },
    });

    // 5. Execute atomic transaction: create Order, OrderItems, Payment, Delivery, reserve Inventory
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId: savedAddress.id,
          status: paymentMethod === "ONLINE" ? "PAYMENT_CONFIRMED" : "ORDER_PLACED",
          paymentStatus: paymentMethod === "ONLINE" ? "PAID" : "PENDING",
          paymentMethod,
          subtotal,
          discount,
          tax,
          shippingFee,
          total,
          couponCode: couponCode || null,
          notes: notes || null,
          deliveryOtp,
          items: {
            create: orderItemsData,
          },
          payments: {
            create: {
              transactionId: `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
              provider: paymentMethod === "ONLINE" ? "STRIPE_SIMULATED" : "COD_PENDING",
              amount: total,
              currency: "USD",
              status: paymentMethod === "ONLINE" ? "SUCCESS" : "PENDING",
              rawResponse: JSON.stringify({ verified: true, timestamp: new Date().toISOString() }),
            },
          },
          delivery: {
            create: {
              status: "UNASSIGNED",
              customerOtp: deliveryOtp,
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
          delivery: true,
        },
      });

      // Reserve Inventory for each product
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            available: { decrement: item.quantity },
            reserved: { increment: item.quantity },
          },
        });
      }

      // Clear user's cart
      const cart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Customer notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Order Placed Successfully",
          message: `Your EYECAP order ${orderNumber} for $${total} has been confirmed. Secure handover OTP: ${deliveryOtp}.`,
          type: "ORDER",
          link: `/account/orders`,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORDER_CREATED",
          entityType: "Order",
          entityId: newOrder.id,
          details: JSON.stringify({
            orderNumber,
            total,
            itemsCount: items.length,
            deliveryOtp,
          }),
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      deliveryOtp: order.deliveryOtp,
      total: order.total,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        shippingAddress: true,
        delivery: {
          include: {
            partner: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
