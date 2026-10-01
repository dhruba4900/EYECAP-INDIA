import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      customerProfile: true,
      adminProfile: true,
      deliveryPartner: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      customerProfile: user.customerProfile,
      adminProfile: user.adminProfile,
      deliveryPartner: user.deliveryPartner,
      defaultAddress: user.addresses[0] || null,
    },
  });
}
