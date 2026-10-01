import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["DELIVERY_PARTNER"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const { status, failedReason } = await req.json();

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: auth.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, partnerId: partner.id },
      include: { order: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery assignment not found" }, { status: 404 });
    }

    const updates: any = { status };
    let orderStatus = delivery.order.status;

    if (status === "ACCEPTED") {
      updates.acceptedAt = new Date();
    } else if (status === "PICKED_UP") {
      updates.pickedUpAt = new Date();
      orderStatus = "PICKED_UP";
    } else if (status === "OUT_FOR_DELIVERY") {
      updates.outForDeliveryAt = new Date();
      orderStatus = "OUT_FOR_DELIVERY";
    } else if (status === "FAILED") {
      updates.failedAt = new Date();
      updates.failedReason = failedReason || "Customer unreachable / rescheduled";
      orderStatus = "FAILED";
    }

    const [updatedDelivery] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id: delivery.id },
        data: updates,
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatus },
      }),
    ]);

    // Customer notification
    await prisma.notification.create({
      data: {
        userId: delivery.order.userId,
        title: `Order Update: ${orderStatus.replace(/_/g, " ")}`,
        message:
          status === "OUT_FOR_DELIVERY"
            ? `Your order #${delivery.order.orderNumber} is now out for delivery! Please keep your handover OTP ${delivery.customerOtp} ready.`
            : `Your order #${delivery.order.orderNumber} status is now ${orderStatus}.`,
        type: "DELIVERY",
        link: "/account/orders",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.user.id,
        action: `DELIVERY_${status}`,
        entityType: "Delivery",
        entityId: delivery.id,
        details: JSON.stringify({
          orderNumber: delivery.order.orderNumber,
          status,
          failedReason,
        }),
      },
    });

    return NextResponse.json({ success: true, delivery: updatedDelivery });
  } catch (error: any) {
    console.error("Delivery status error:", error);
    return NextResponse.json({ error: "Failed to update delivery status" }, { status: 500 });
  }
}
