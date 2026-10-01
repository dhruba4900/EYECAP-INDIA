import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth(["DELIVERY_PARTNER"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: auth.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: "Delivery partner profile not found" }, { status: 404 });
    }

    const deliveries = await prisma.delivery.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
            shippingAddress: true,
            items: true,
          },
        },
      },
    });

    const active = deliveries.filter((d) =>
      ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(d.status)
    );
    const completed = deliveries.filter((d) =>
      ["DELIVERED", "FAILED"].includes(d.status)
    );

    return NextResponse.json({
      partner: {
        id: partner.id,
        vehicleType: partner.vehicleType,
        vehiclePlate: partner.vehiclePlate,
        currentZone: partner.currentZone,
        rating: partner.rating,
        totalDeliveries: partner.totalDeliveries,
      },
      deliveries,
      active,
      completed,
    });
  } catch (error: any) {
    console.error("Delivery assignments error:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}
