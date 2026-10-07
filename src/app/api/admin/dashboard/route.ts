import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
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
        select: {
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),

      prisma.order.findMany({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
        select: {
          total: true,
          paymentStatus: true,
        },
      }),

      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),

      prisma.product.count({
        where: {
          isPublished: true,
        },
      }),

      prisma.inventory.findMany({
        where: {
          available: {
            lte: 15,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              basePrice: true,
            },
          },
        },
        take: 8,
      }),

      prisma.order.findMany({
        take: 6,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          delivery: {
            include: {
              partner: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      prisma.deliveryPartner.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = allOrders
      .filter((order) => order.paymentStatus === "PAID")
      .reduce((sum, order) => sum + order.total, 0);

    const todayRevenue = todayOrders
      .filter((order) => order.paymentStatus === "PAID")
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = allOrders.filter(
      (order) =>
        order.status !== "DELIVERED" &&
        order.status !== "CANCELLED"
    ).length;

    const deliveredOrders = allOrders.filter(
      (order) => order.status === "DELIVERED"
    ).length;

    const cancelledOrders = allOrders.filter(
      (order) => order.status === "CANCELLED"
    ).length;

    const last7Days: {
      date: string;
      sales: number;
      orders: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setDate(date.getDate() - i);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const matchingOrders = allOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);

        return (
          orderDate >= dayStart &&
          orderDate <= dayEnd
        );
      });

      const daySales = matchingOrders
        .filter((order) => order.paymentStatus === "PAID")
        .reduce((sum, order) => sum + order.total, 0);

      last7Days.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: Math.round(daySales),
        orders: matchingOrders.length,
      });
    }

    return NextResponse.json({
      metrics: {
        totalRevenue:
          Math.round(totalRevenue * 100) / 100,

        todayRevenue:
          Math.round(todayRevenue * 100) / 100,

        totalOrders: allOrders.length,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },

      salesChart: last7Days,

      lowStockProducts,

      recentOrders,

      deliveryPartners,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate dashboard metrics",
      },
      {
        status: 500,
      }
    );
  }
}