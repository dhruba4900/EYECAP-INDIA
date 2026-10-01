"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Truck,
  FileText,
  Newspaper,
  LayoutTemplate,
  Sparkles,
  Box,
  LogOut,
  ChevronRight,
  ExternalLink,
  Bell,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login?redirect=/admin");
      } else if (user.role !== "ADMIN") {
        // If logged in as customer or delivery, inform them or allow quick-switch
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
        <p className="text-xs text-gray-400">Redirecting to sign in…</p>
      </div>
    );
  }

  // If user is not admin, show permission gate with quick-switch button
  if (user && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#08090C] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-eyecap-surface border border-purple-900/50 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Privileges Required</h2>
          <p className="text-xs text-eyecap-silver leading-relaxed">
            You are currently logged in as <span className="text-eyecap-cyan font-bold font-mono">{user.email}</span> with role <span className="font-mono text-amber-400">{user.role}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-eyecap-card border border-eyecap-border text-xs text-eyecap-silver hover:text-white"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menu = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products Catalog", href: "/admin/products", icon: Package },
    { label: "Homepage CMS", href: "/admin/content/homepage", icon: LayoutTemplate },
    { label: "Posts & Promotions", href: "/admin/posts", icon: Newspaper },
    { label: "3D Graphics Studio", href: "/admin/graphics", icon: Sparkles },
    { label: "3D Asset Library", href: "/admin/assets/3d", icon: Box },
    { label: "Inventory Stock", href: "/admin/inventory", icon: Boxes },
    { label: "Orders & Dispatch", href: "/admin/orders", icon: ShoppingBag },
    { label: "Courier Partners", href: "/admin/delivery-partners", icon: Truck },
    { label: "Audit & Security", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 flex">
      {/* Admin Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-[#0A0C12] border-r border-[#1C202C] flex flex-col justify-between transition-all duration-200 shrink-0 sticky top-0 h-screen z-30`}
      >
        <div>
          {/* Logo Brand */}
          <div className="h-16 border-b border-[#1C202C] flex items-center justify-between px-5">
            <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white shrink-0 shadow-md shadow-purple-500/20">
                E
              </div>
              {!collapsed && (
                <div>
                  <span className="font-bold text-sm tracking-[0.2em] text-white">EYECAP</span>
                  <span className="block text-[9px] font-mono text-purple-400 uppercase -mt-0.5 tracking-wider">
                    Controller
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-3">
            {menu.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 font-semibold"
                      : "text-gray-400 hover:text-white hover:bg-[#121520]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-purple-400" : "text-gray-500"}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#1C202C] space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-[#121520] transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-eyecap-cyan" />
            {!collapsed && <span>Live Storefront</span>}
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="h-16 bg-[#0A0C12]/80 backdrop-blur-md border-b border-[#1C202C] px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold bg-purple-950/50 px-2.5 py-1 rounded border border-purple-800/40">
              Admin Controller v2.6
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#121520] px-3 py-1.5 rounded-full border border-[#1C202C]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">{user?.firstName} {user?.lastName} (SuperAdmin)</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
