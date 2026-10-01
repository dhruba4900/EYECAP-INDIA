import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const partners = await prisma.deliveryPartner.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        deliveries: {
          where: {
            status: { in: ["ASSIGNED", "ACCEPTED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
          },
          select: { id: true, status: true },
        },
      },
    });

    const formatted = partners.map((p) => ({
      id: p.id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      email: p.user.email,
      phone: p.user.phone,
      vehicleType: p.vehicleType,
      vehiclePlate: p.vehiclePlate,
      currentZone: p.currentZone,
      rating: p.rating,
      totalDeliveries: p.totalDeliveries,
      activeDeliveriesCount: p.deliveries.length,
      isAvailable: p.isAvailable,
    }));

    return NextResponse.json({ partners: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load delivery partners" }, { status: 500 });
  }
}
