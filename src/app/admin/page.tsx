"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Users,
  TrendingUp,
  ArrowUpRight,
  Truck,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Dashboard error", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-[#0F121B] animate-pulse border border-[#1C202C]" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-rose-400 text-xs">Failed to load dashboard metrics.</div>;
  }

  const { metrics, salesChart, lowStockProducts, recentOrders } = data;

  const maxSale = Math.max(...salesChart.map((d: any) => d.sales), 1);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Operations Console</h1>
        <p className="text-xs text-gray-400 mt-0.5">Real-time revenue, fulfillment status, and inventory velocity.</p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Cumulative Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">
              {formatCurrency(metrics.totalRevenue)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>Today: {formatCurrency(metrics.todayRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Orders In Pipeline</span>
            <div className="p-2 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-800/40">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.totalOrders} Total
            </span>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
              <span className="text-amber-400 font-mono">{metrics.pendingOrders} Active</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">{metrics.deliveredOrders} Delivered</span>
            </div>
          </div>
        </div>

        {/* Catalog Items */}
        <div className="p-5 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Active Silhouettes</span>
            <div className="p-2 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-800/40">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.totalProducts} Eyewear Models
            </span>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Across 4 Luxury Collections</p>
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="p-5 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Stock Alerts</span>
            <div className="p-2 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-bold font-mono ${metrics.lowStockCount > 0 ? "text-amber-400" : "text-white"}`}>
              {metrics.lowStockCount} Products
            </span>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">Below Restock Threshold</p>
          </div>
        </div>
      </div>

      {/* 7-DAY SALES VELOCITY CHART */}
      <div className="p-6 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              7-Day Revenue Velocity
            </h3>
            <p className="text-xs text-gray-400">Validated completed checkouts and incoming receipts</p>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-800/40">
            Real-Time Engine
          </span>
        </div>

        {/* Responsive Bar Graphic */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6 pb-2 px-2 border-b border-[#1C202C]">
          {salesChart.map((day: any, i: number) => {
            const heightPercent = Math.max(12, Math.round((day.sales / maxSale) * 100));
            return (
              <div key={i} className="flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${day.sales}
                </span>
                <div
                  className="w-full max-w-[42px] bg-gradient-to-t from-purple-800 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:brightness-125 group-hover:shadow-lg group-hover:shadow-purple-500/20"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-mono text-gray-400 mt-1">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TWO COLUMN LOWER SECTION: RECENT ORDERS & LOW STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Feed */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Fulfillment Pipeline
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Manage All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#1C202C]">
            {recentOrders.map((ord: any) => (
              <div key={ord.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                          : "bg-[#161A26] text-purple-300 border-purple-800/50"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] mt-0.5">
                    {ord.user?.firstName} {ord.user?.lastName} • {formatDate(ord.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white">{formatCurrency(ord.total)}</span>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Courier: {ord.delivery?.partner?.user?.firstName || "Unassigned"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low Inventory Watch</span>
            </h3>
            <Link
              href="/admin/inventory"
              className="text-xs font-mono text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#1C202C]">
            {lowStockProducts.map((inv: any) => (
              <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{inv.product?.name}</p>
                  <p className="text-[11px] font-mono text-gray-400">SKU: {inv.product?.sku}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    {inv.available} units left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
