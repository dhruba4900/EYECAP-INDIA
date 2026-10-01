import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const { status, paymentStatus } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: `Order Status Update: ${status || paymentStatus}`,
        message: `Your order #${order.orderNumber} status changed to ${status || paymentStatus}.`,
        type: "ORDER",
        link: `/account/orders`,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: "ORDER_STATUS_UPDATED",
        entityType: "Order",
        entityId: id,
        details: JSON.stringify({
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: status,
          paymentStatus,
        }),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
