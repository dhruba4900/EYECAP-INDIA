"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Moon,
  Package,
  RefreshCw,
  ShoppingBag,
  Sun,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils";
import BrandLogo from "@/components/layout/BrandLogo";

type DashboardData = {
  metrics: {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
  };
  salesChart: {
    date: string;
    sales: number;
    orders: number;
  }[];
  lowStockProducts: any[];
  recentOrders: any[];
};

type ThemeMode = "dark" | "light";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(
      "eyecap-admin-theme"
    ) as ThemeMode | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("eyecap-admin-theme", theme);
  }, [theme]);

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load dashboard");
      }

      const json = await res.json();

      if (!json?.metrics) {
        throw new Error("Invalid dashboard response");
      }

      setData(json);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const maxSale = useMemo(() => {
    if (!data?.salesChart?.length) return 1;

    return Math.max(
      ...data.salesChart.map((item) => Number(item.sales) || 0),
      1
    );
  }, [data]);

  const totalChartSales = useMemo(() => {
    if (!data?.salesChart?.length) return 0;

    return data.salesChart.reduce(
      (sum, item) => sum + (Number(item.sales) || 0),
      0
    );
  }, [data]);

  const averageDailySales = useMemo(() => {
    if (!data?.salesChart?.length) return 0;

    return totalChartSales / data.salesChart.length;
  }, [data, totalChartSales]);

  const isLight = theme === "light";

  const page = isLight
    ? "bg-slate-50 text-slate-900"
    : "bg-[#05070B] text-white";

  const panel = isLight
    ? "bg-white border-slate-200"
    : "bg-[#0A0F18]/90 border-[#182538]";

  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const subtle = isLight ? "text-slate-600" : "text-slate-300";

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-full transition-colors duration-500",
          page
        )}
      >
        <DashboardSkeleton isLight={isLight} />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={cn(
          "min-h-[70vh] flex items-center justify-center transition-colors duration-500",
          page
        )}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-3xl border p-8 text-center shadow-2xl",
            panel
          )}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          <h2 className="text-lg font-bold">Dashboard unavailable</h2>

          <p className={cn("mt-2 text-sm", muted)}>
            {error || "Failed to load dashboard metrics."}
          </p>

          <button
            onClick={() => loadDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { metrics, salesChart, lowStockProducts, recentOrders } = data;

  return (
    <div
      className={cn(
        "relative min-h-full overflow-hidden transition-colors duration-500",
        page
      )}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute -top-32 right-0 h-96 w-96 rounded-full blur-3xl",
            isLight ? "bg-blue-200/40" : "bg-blue-600/10"
          )}
        />

        <div
          className={cn(
            "absolute top-[38rem] -left-40 h-80 w-80 rounded-full blur-3xl",
            isLight ? "bg-cyan-200/30" : "bg-cyan-500/5"
          )}
        />

        {!isLight && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.025)_1px,transparent_1px)] bg-[size:42px_42px]" />
        )}
      </div>

      <div className="relative z-10 space-y-7">
        {/* HEADER */}
        <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between animate-[fadeUp_.45s_ease-out]">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg transition-all duration-300 hover:-translate-y-1",
                isLight
                  ? "bg-white border-slate-200 shadow-blue-100"
                  : "bg-[#0C1420] border-blue-500/20 shadow-blue-950/30"
              )}
            >
              <BrandLogo className="h-9 w-9 object-contain" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  EYECAP Command Center
                </h1>

                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-400">
                  Admin
                </span>
              </div>

              <p className={cn("mt-1 text-sm", muted)}>
                Monitor revenue, orders, inventory and customer activity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-300",
                refreshing && "cursor-not-allowed opacity-60",
                isLight
                  ? "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                  : "border-[#1C2A3D] bg-[#0B111B] text-slate-300 hover:border-blue-500/40 hover:text-white"
              )}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  refreshing && "animate-spin"
                )}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={() =>
                setTheme((current) =>
                  current === "dark" ? "light" : "dark"
                )
              }
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5",
                isLight
                  ? "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  : "border-[#1C2A3D] bg-[#0B111B] text-slate-300 hover:border-blue-500/40 hover:text-white"
              )}
              aria-label="Toggle theme"
            >
              {isLight ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-blue-400" />
              )}

              {isLight ? "Dark" : "Light"}
            </button>
          </div>
        </section>

        {/* LIVE STATUS */}
        <section
          className={cn(
            "flex flex-col gap-3 rounded-2xl border px-4 py-3.5 shadow-sm transition-all duration-300 sm:flex-row sm:items-center sm:justify-between",
            isLight
              ? "border-blue-100 bg-white/80"
              : "border-blue-500/10 bg-blue-500/[0.035]"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>

            <span className={cn("text-xs font-medium", subtle)}>
              System operational
            </span>

            <span className={cn("hidden sm:inline text-xs", muted)}>
              •
            </span>

            <span className={cn("text-xs", muted)}>
              Dashboard synced with live platform data
            </span>
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-blue-400">
            EYECAP / LIVE
          </span>
        </section>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            subtitle={`Today ${formatCurrency(metrics.todayRevenue)}`}
            icon={DollarSign}
            iconClass="text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20"
            accent="from-emerald-500/20"
            isLight={isLight}
            delay="0ms"
          />

          <MetricCard
            title="Orders Pipeline"
            value={String(metrics.totalOrders)}
            subtitle={`${metrics.pendingOrders} active • ${metrics.deliveredOrders} delivered`}
            icon={ShoppingBag}
            iconClass="text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20"
            accent="from-blue-500/20"
            isLight={isLight}
            delay="60ms"
          />

          <MetricCard
            title="Customers"
            value={String(metrics.totalCustomers)}
            subtitle={`${metrics.totalProducts} active products`}
            icon={Users}
            iconClass="text-cyan-400"
            iconBg="bg-cyan-500/10 border-cyan-500/20"
            accent="from-cyan-500/20"
            isLight={isLight}
            delay="120ms"
          />

          <MetricCard
            title="Stock Alerts"
            value={String(metrics.lowStockCount)}
            subtitle={
              metrics.lowStockCount > 0
                ? "Products need attention"
                : "Inventory looks healthy"
            }
            icon={AlertTriangle}
            iconClass={
              metrics.lowStockCount > 0
                ? "text-amber-400"
                : "text-emerald-400"
            }
            iconBg={
              metrics.lowStockCount > 0
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-emerald-500/10 border-emerald-500/20"
            }
            accent={
              metrics.lowStockCount > 0
                ? "from-amber-500/20"
                : "from-emerald-500/20"
            }
            isLight={isLight}
            delay="180ms"
          />
        </section>

        {/* REVENUE + QUICK STATS */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Revenue Chart */}
          <div
            className={cn(
              "xl:col-span-8 rounded-3xl border p-5 sm:p-6 shadow-xl transition-all duration-500 hover:-translate-y-0.5",
              panel
            )}
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em]">
                    Revenue Velocity
                  </h2>
                </div>

                <p className={cn("mt-1 text-xs", muted)}>
                  7-day paid revenue performance
                </p>
              </div>

              <div
                className={cn(
                  "rounded-xl border px-3 py-2 text-right",
                  isLight
                    ? "border-blue-100 bg-blue-50"
                    : "border-blue-500/10 bg-blue-500/5"
                )}
              >
                <p className={cn("text-[9px] uppercase tracking-wider", muted)}>
                  7D Revenue
                </p>

                <p className="mt-0.5 font-mono text-sm font-bold text-blue-400">
                  {formatCurrency(totalChartSales)}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className={cn(
                      "border-t",
                      isLight
                        ? "border-slate-100"
                        : "border-[#162234]"
                    )}
                  />
                ))}
              </div>

              <div className="relative grid h-64 grid-cols-7 items-end gap-2 sm:gap-4">
                {salesChart.map((day, index) => {
                  const value = Number(day.sales) || 0;
                  const height = Math.max(
                    value > 0 ? 8 : 3,
                    Math.round((value / maxSale) * 100)
                  );

                  const isHighest = value === maxSale && value > 0;

                  return (
                    <div
                      key={`${day.date}-${index}`}
                      className="group flex h-full flex-col items-center justify-end gap-2"
                    >
                      <div className="relative flex w-full flex-1 items-end justify-center">
                        <div
                          className={cn(
                            "absolute bottom-[calc(var(--bar-height))] mb-2 translate-y-2 rounded-lg border px-2 py-1 text-[9px] font-mono opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
                            isLight
                              ? "border-slate-200 bg-white text-slate-700"
                              : "border-[#24344A] bg-[#101927] text-slate-200"
                          )}
                          style={
                            {
                              "--bar-height": `${height}%`,
                            } as React.CSSProperties
                          }
                        >
                          {formatCurrency(value)}
                        </div>

                        <div
                          className={cn(
                            "w-full max-w-[46px] rounded-t-xl transition-all duration-500 ease-out group-hover:brightness-125 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]",
                            isHighest
                              ? "bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-300"
                              : "bg-gradient-to-t from-blue-900 via-blue-700 to-blue-400"
                          )}
                          style={{
                            height: `${height}%`,
                            minHeight: value > 0 ? "8px" : "3px",
                          }}
                        />
                      </div>

                      <span
                        className={cn(
                          "whitespace-nowrap text-[9px] font-mono",
                          muted
                        )}
                      >
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Operations Snapshot */}
          <div
            className={cn(
              "xl:col-span-4 rounded-3xl border p-5 sm:p-6 shadow-xl",
              panel
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.15em]">
                  Operations
                </h2>

                <p className={cn("mt-1 text-xs", muted)}>
                  Current platform snapshot
                </p>
              </div>

              <Boxes className="h-5 w-5 text-blue-400" />
            </div>

            <div className="mt-6 space-y-3">
              <OperationRow
                icon={Clock3}
                label="Pending orders"
                value={metrics.pendingOrders}
                color="text-amber-400"
                isLight={isLight}
              />

              <OperationRow
                icon={CheckCircle2}
                label="Delivered"
                value={metrics.deliveredOrders}
                color="text-emerald-400"
                isLight={isLight}
              />

              <OperationRow
                icon={Truck}
                label="Cancelled"
                value={metrics.cancelledOrders}
                color="text-rose-400"
                isLight={isLight}
              />

              <OperationRow
                icon={Package}
                label="Products"
                value={metrics.totalProducts}
                color="text-blue-400"
                isLight={isLight}
              />
            </div>

            <div
              className={cn(
                "mt-5 rounded-2xl border p-4",
                isLight
                  ? "border-slate-200 bg-slate-50"
                  : "border-[#182538] bg-[#080D15]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", muted)}>
                  Avg. daily revenue
                </span>

                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>

              <p className="mt-2 font-mono text-lg font-bold text-blue-400">
                {formatCurrency(averageDailySales)}
              </p>
            </div>
          </div>
        </section>

        {/* LOWER GRID */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Recent Orders */}
          <div
            className={cn(
              "xl:col-span-7 rounded-3xl border p-5 sm:p-6 shadow-xl",
              panel
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.15em]">
                  Recent Orders
                </h2>

                <p className={cn("mt-1 text-xs", muted)}>
                  Latest customer activity
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl">
              {recentOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No recent orders"
                  text="New orders will appear here."
                  isLight={isLight}
                />
              ) : (
                <div
                  className={cn(
                    "divide-y rounded-2xl border",
                    isLight
                      ? "divide-slate-100 border-slate-200"
                      : "divide-[#182538] border-[#182538]"
                  )}
                >
                  {recentOrders.map((order: any, index: number) => (
                    <div
                      key={order.id}
                      className={cn(
                        "group flex flex-col gap-3 p-4 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between",
                        isLight
                          ? "hover:bg-blue-50/50"
                          : "hover:bg-blue-500/[0.035]"
                      )}
                      style={{
                        animationDelay: `${index * 45}ms`,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold">
                            {order.orderNumber}
                          </span>

                          <OrderStatus status={order.status} />
                        </div>

                        <p className={cn("mt-1 truncate text-[11px]", muted)}>
                          {order.user?.firstName || "Customer"}{" "}
                          {order.user?.lastName || ""}{" "}
                          <span className="mx-1">•</span>
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-5 sm:justify-end">
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold">
                            {formatCurrency(order.total)}
                          </p>

                          <p className={cn("mt-1 text-[10px]", muted)}>
                            Courier:{" "}
                            {order.delivery?.partner?.user?.firstName ||
                              "Unassigned"}
                          </p>
                        </div>

                        <ArrowUpRight
                          className={cn(
                            "h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                            isLight ? "text-slate-300" : "text-slate-700"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div
            className={cn(
              "xl:col-span-5 rounded-3xl border p-5 sm:p-6 shadow-xl",
              panel
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />

                  <h2 className="text-sm font-bold uppercase tracking-[0.15em]">
                    Inventory Watch
                  </h2>
                </div>

                <p className={cn("mt-1 text-xs", muted)}>
                  Products approaching restock threshold
                </p>
              </div>

              <Link
                href="/admin/inventory"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
              >
                Inventory
                <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-5">
              {lowStockProducts.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Inventory healthy"
                  text="No products are currently below threshold."
                  isLight={isLight}
                  success
                />
              ) : (
                <div
                  className={cn(
                    "divide-y rounded-2xl border",
                    isLight
                      ? "divide-slate-100 border-slate-200"
                      : "divide-[#182538] border-[#182538]"
                  )}
                >
                  {lowStockProducts.map((inventory: any, index: number) => (
                    <div
                      key={inventory.id}
                      className={cn(
                        "flex items-center justify-between gap-4 p-4 transition-all duration-300",
                        isLight
                          ? "hover:bg-amber-50/40"
                          : "hover:bg-amber-500/[0.035]"
                      )}
                      style={{
                        animationDelay: `${index * 45}ms`,
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {inventory.product?.name || "Unknown Product"}
                        </p>

                        <p
                          className={cn(
                            "mt-1 truncate font-mono text-[10px]",
                            muted
                          )}
                        >
                          SKU: {inventory.product?.sku || "N/A"}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "shrink-0 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-bold",
                          Number(inventory.available) <= 5
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        )}
                      >
                        {inventory.available} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER QUICK LINKS */}
        <section
          className={cn(
            "grid grid-cols-1 gap-3 pb-2 sm:grid-cols-3",
          )}
        >
          <QuickLink
            href="/admin/products"
            icon={Package}
            title="Products Catalog"
            text="Manage your product catalogue"
            isLight={isLight}
          />

          <QuickLink
            href="/admin/content/homepage"
            icon={Boxes}
            title="Homepage CMS"
            text="Control homepage content & hero"
            isLight={isLight}
          />

          <QuickLink
            href="/admin/orders"
            icon={Truck}
            title="Orders & Dispatch"
            text="Manage fulfillment pipeline"
            isLight={isLight}
          />
        </section>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -800px 0;
          }
          100% {
            background-position: 800px 0;
          }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  iconBg,
  accent,
  isLight,
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  accent: string;
  isLight: boolean;
  delay: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-5 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
        isLight
          ? "border-slate-200 bg-white hover:border-blue-200 hover:shadow-blue-100"
          : "border-[#182538] bg-[#0A0F18]/90 hover:border-blue-500/20 hover:shadow-blue-950/20"
      )}
      style={{
        animation: "fadeUp .45s ease-out both",
        animationDelay: delay,
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-70 transition-all duration-500 group-hover:scale-125",
          accent
        )}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.16em]",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            {title}
          </span>

          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105",
              iconBg
            )}
          >
            <Icon className={cn("h-4 w-4", iconClass)} />
          </div>
        </div>

        <p className="mt-6 truncate font-mono text-xl font-bold tracking-tight sm:text-2xl">
          {value}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-blue-400" />

          <p
            className={cn(
              "truncate text-[10px] font-medium",
              isLight ? "text-slate-500" : "text-slate-400"
            )}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function OperationRow({
  icon: Icon,
  label,
  value,
  color,
  isLight,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  isLight: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-300",
        isLight
          ? "border-slate-100 bg-slate-50 hover:border-blue-100 hover:bg-blue-50/50"
          : "border-[#162234] bg-[#080D15] hover:border-blue-500/15 hover:bg-blue-500/[0.025]"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4", color)} />

        <span
          className={cn(
            "text-xs font-medium",
            isLight ? "text-slate-600" : "text-slate-300"
          )}
        >
          {label}
        </span>
      </div>

      <span className="font-mono text-sm font-bold">{value}</span>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const normalized = String(status || "").toUpperCase();

  let classes =
    "border-blue-500/20 bg-blue-500/10 text-blue-400";

  if (normalized === "DELIVERED") {
    classes =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (normalized === "CANCELLED") {
    classes =
      "border-rose-500/20 bg-rose-500/10 text-rose-400";
  }

  if (
    normalized === "PENDING" ||
    normalized === "PROCESSING"
  ) {
    classes =
      "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-wide",
        classes
      )}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  isLight,
  success = false,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  isLight: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border px-5 py-10 text-center",
        isLight
          ? "border-slate-200 bg-slate-50"
          : "border-[#182538] bg-[#080D15]"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl border",
          success
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-xs font-semibold">{title}</p>

      <p
        className={cn(
          "mt-1 max-w-xs text-[10px]",
          isLight ? "text-slate-500" : "text-slate-500"
        )}
      >
        {text}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  text,
  isLight,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  text: string;
  isLight: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5",
        isLight
          ? "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
          : "border-[#182538] bg-[#0A0F18] hover:border-blue-500/20 hover:bg-blue-500/[0.035]"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105",
          isLight
            ? "border-blue-100 bg-blue-50 text-blue-500"
            : "border-blue-500/15 bg-blue-500/10 text-blue-400"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{title}</p>

        <p className={cn("mt-0.5 truncate text-[10px]", isLight ? "text-slate-500" : "text-slate-500")}>
          {text}
        </p>
      </div>

      <ArrowUpRight
        className={cn(
          "h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          isLight ? "text-slate-300" : "text-slate-700"
        )}
      />
    </Link>
  );
}

function DashboardSkeleton({ isLight }: { isLight: boolean }) {
  const skeleton = isLight
    ? "bg-slate-200/80"
    : "bg-[#101927]";

  return (
    <div className="space-y-7 animate-pulse">
      <div className="flex items-center gap-4">
        <div className={cn("h-14 w-14 rounded-2xl", skeleton)} />

        <div className="space-y-2">
          <div className={cn("h-7 w-64 rounded-lg", skeleton)} />
          <div className={cn("h-4 w-80 rounded-lg", skeleton)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={cn(
              "h-40 rounded-3xl border",
              isLight
                ? "border-slate-200 bg-white"
                : "border-[#182538] bg-[#0A0F18]"
            )}
          >
            <div className="space-y-4 p-5">
              <div className={cn("h-4 w-24 rounded", skeleton)} />
              <div className={cn("h-8 w-36 rounded", skeleton)} />
              <div className={cn("h-3 w-44 rounded", skeleton)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div
          className={cn(
            "h-80 rounded-3xl border xl:col-span-8",
            isLight
              ? "border-slate-200 bg-white"
              : "border-[#182538] bg-[#0A0F18]"
          )}
        />

        <div
          className={cn(
            "h-80 rounded-3xl border xl:col-span-4",
            isLight
              ? "border-slate-200 bg-white"
              : "border-[#182538] bg-[#0A0F18]"
          )}
        />
      </div>
    </div>
  );
}