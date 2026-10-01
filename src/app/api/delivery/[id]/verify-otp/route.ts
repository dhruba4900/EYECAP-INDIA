import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["DELIVERY_PARTNER"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = params;
    const { otp, recipientName, proofImageUrl, notes } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { error: "Customer delivery OTP is required for secure handover." },
        { status: 400 }
      );
    }

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: auth.user.id },
      include: { user: true },
    });

    if (!partner) {
      return NextResponse.json({ error: "Delivery partner profile not found" }, { status: 404 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { id, partnerId: partner.id },
      include: {
        order: {
          include: {
            items: true,
            user: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery assignment not found" }, { status: 404 });
    }

    if (delivery.status === "DELIVERED") {
      return NextResponse.json(
        { error: "This order has already been verified and delivered." },
        { status: 400 }
      );
    }

    // STRICT SERVER-SIDE OTP VALIDATION
    const cleanProvidedOtp = String(otp).trim();
    const serverStoredOtp = String(delivery.customerOtp).trim();

    if (cleanProvidedOtp !== serverStoredOtp) {
      // Audit log failed attempt
      await prisma.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "DELIVERY_OTP_FAILED",
          entityType: "Delivery",
          entityId: delivery.id,
          details: JSON.stringify({
            providedOtp: cleanProvidedOtp,
            orderNumber: delivery.order.orderNumber,
          }),
        },
      });

      return NextResponse.json(
        {
          error: "Invalid delivery OTP. Handover cannot be completed. Please ask customer for the 6-digit OTP shown in their EYECAP account.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Atomic transaction: update delivery, update order, finalize inventory, increment courier metrics
    await prisma.$transaction(async (tx) => {
      // 1. Mark Delivery verified and delivered
      await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          otpVerified: true,
          otpVerifiedAt: now,
          deliveredAt: now,
          recipientName: recipientName || `${delivery.order.user.firstName} ${delivery.order.user.lastName}`,
          proofImageUrl: proofImageUrl || null,
          partnerNotes: notes || null,
        },
      });

      // 2. Mark Order DELIVERED and finalize payment if COD
      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: "DELIVERED",
          paymentStatus: "PAID",
        },
      });

      // 3. Finalize Inventory: decrease reserved, increase sold for each item
      for (const item of delivery.order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }

      // 4. Update Courier Statistics
      await tx.deliveryPartner.update({
        where: { id: partner.id },
        data: {
          totalDeliveries: { increment: 1 },
        },
      });

      // 5. Notify Customer
      await tx.notification.create({
        data: {
          userId: delivery.order.userId,
          title: "Order Delivered Successfully! 🎉",
          message: `Your EYECAP order #${delivery.order.orderNumber} has been delivered. Thank you for choosing EYECAP.`,
          type: "DELIVERY",
          link: `/account/orders`,
        },
      });

      // 6. Notify Admins
      const admins = await tx.user.findMany({ where: { role: "ADMIN" } });
      for (const adm of admins) {
        await tx.notification.create({
          data: {
            userId: adm.id,
            title: `Order #${delivery.order.orderNumber} Delivered`,
            message: `Courier ${partner.user.firstName} ${partner.user.lastName} successfully completed delivery via OTP verification.`,
            type: "ORDER",
            link: `/admin/orders`,
          },
        });
      }

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: auth.user.id,
          action: "OTP_VERIFIED_ORDER_DELIVERED",
          entityType: "Delivery",
          entityId: delivery.id,
          details: JSON.stringify({
            orderNumber: delivery.order.orderNumber,
            verifiedAt: now.toISOString(),
            partnerName: `${partner.user.firstName} ${partner.user.lastName}`,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "OTP successfully verified! Delivery confirmed and inventory finalized.",
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Server error during OTP verification." },
      { status: 500 }
    );
  }
}
