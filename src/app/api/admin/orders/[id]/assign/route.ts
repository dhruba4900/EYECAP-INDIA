import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const { partnerId } = await req.json();

    if (!partnerId) {
      return NextResponse.json({ error: "Delivery partner ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        delivery: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
      include: { user: true },
    });

    if (!partner) {
      return NextResponse.json({ error: "Delivery partner not found" }, { status: 404 });
    }

    // Update or create delivery record
    const updatedDelivery = await prisma.delivery.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        partnerId: partner.id,
        status: "ASSIGNED",
        customerOtp: order.deliveryOtp,
        assignedAt: new Date(),
      },
      update: {
        partnerId: partner.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

    // Update order status to READY_FOR_PICKUP
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "READY_FOR_PICKUP" },
    });

    // Notify delivery partner
    await prisma.notification.create({
      data: {
        userId: partner.userId,
        title: "New Delivery Assigned",
        message: `Order #${order.orderNumber} is assigned to you and ready for pickup.`,
        type: "DELIVERY",
        link: "/delivery",
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Order Dispatched to Courier",
        message: `Courier ${partner.user.firstName} ${partner.user.lastName} has been assigned to your order #${order.orderNumber}.`,
        type: "ORDER",
        link: "/account/orders",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "DELIVERY_ASSIGNED",
        entityType: "Delivery",
        entityId: updatedDelivery.id,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          partnerName: `${partner.user.firstName} ${partner.user.lastName}`,
        }),
      },
    });

    return NextResponse.json({ success: true, delivery: updatedDelivery });
  } catch (error: any) {
    console.error("Assign error:", error);
    return NextResponse.json({ error: "Failed to assign delivery partner" }, { status: 500 });
  }
}
