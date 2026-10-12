import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  "Vary": "Cookie, Authorization",
};

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { headers: NO_CACHE_HEADERS });
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
      return NextResponse.json({ user: null }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(
      {
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
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

