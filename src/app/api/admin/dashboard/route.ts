import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      allOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      deliveryPartners,
    ] = await Promise.all([
      prisma.order.findMany({
        select: { total: true, status: true, paymentStatus: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: todayStart } },
        select: { total: true },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.inventory.findMany({
        where: {
          available: { lte: 15 },
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, basePrice: true },
          },
        },
        take: 8,
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          delivery: {
            include: {
              partner: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      }),
      prisma.deliveryPartner.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, phone: true } },
          _count: { select: { deliveries: true } },
        },
      }),
    ]);

    // Financial calculations
    const totalRevenue = allOrders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.total, 0);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const pendingOrdersCount = allOrders.filter(
      (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
    ).length;

    const deliveredOrdersCount = allOrders.filter((o) => o.status === "DELIVERED").length;
    const cancelledOrdersCount = allOrders.filter((o) => o.status === "CANCELLED").length;

    // Generate 7-day sales curve
    const last7Days: { date: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const matchingOrders = allOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const daySales = matchingOrders
        .filter((o) => o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + o.total, 0);

      last7Days.push({
        date: dateStr,
        sales: Math.round(daySales),
        orders: matchingOrders.length,
      });
    }

    return NextResponse.json({
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        totalOrders: allOrders.length,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      salesChart: last7Days,
      lowStockProducts,
      recentOrders,
      deliveryPartners,
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to generate dashboard metrics" }, { status: 500 });
  }
}
