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
  FolderTree,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BrandLogo from "@/components/layout/BrandLogo";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login?redirect=/admin");
      } else if (user.role !== "ADMIN") {
        // The permission gate below handles non-admin users.
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C]">
        <p className="text-xs text-gray-400">
          Redirecting to sign in…
        </p>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090C] p-6 text-center">
        <div className="max-w-md space-y-5 rounded-3xl border border-purple-900/50 bg-eyecap-surface p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-800 bg-purple-950/60 text-purple-400">
            <Shield className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-white">
            Administrator Privileges Required
          </h2>

          <p className="text-xs leading-relaxed text-eyecap-silver">
            You are currently logged in as{" "}
            <span className="font-mono font-bold text-eyecap-cyan">
              {user.email}
            </span>{" "}
            with role{" "}
            <span className="font-mono text-amber-400">
              {user.role}
            </span>.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/"
              className="w-full rounded-xl border border-eyecap-border bg-eyecap-card py-2.5 text-xs text-eyecap-silver hover:text-white"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menu = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Products Catalog",
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Category Management",
      href: "/admin/categories",
      icon: FolderTree,
    },
    {
      label: "Homepage CMS",
      href: "/admin/content/homepage",
      icon: LayoutTemplate,
    },
    {
      label: "Posts & Promotions",
      href: "/admin/posts",
      icon: Newspaper,
    },
    {
      label: "3D Graphics Studio",
      href: "/admin/graphics",
      icon: Sparkles,
    },
    {
      label: "3D Asset Library",
      href: "/admin/assets/3d",
      icon: Box,
    },
    {
      label: "Inventory Stock",
      href: "/admin/inventory",
      icon: Boxes,
    },
    {
      label: "Orders & Dispatch",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      label: "Courier Partners",
      href: "/admin/delivery-partners",
      icon: Truck,
    },
    {
      label: "Audit & Security",
      href: "/admin/audit-logs",
      icon: FileText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#07080B] text-gray-200">
      {/* Admin Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } sticky top-0 z-30 flex h-screen shrink-0 flex-col justify-between border-r border-[#1C202C] bg-[#0A0C12] transition-all duration-200`}
      >
        <div>
          {/* Brand */}
          <div className="flex h-16 items-center justify-between border-b border-[#1C202C] px-5">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <BrandLogo className="h-9 w-9 shrink-0 object-contain" />

              {!collapsed && (
                <div>
                  <span className="text-sm font-bold tracking-[0.2em] text-white">
                    EYECAP
                  </span>
                  <span className="-mt-0.5 block text-[9px] font-mono uppercase tracking-wider text-purple-400">
                    Controller
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-3 space-y-1.5 p-3">
            {menu.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(`${item.href}/`));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    active
                      ? "border border-purple-500/40 bg-purple-600/20 font-semibold text-purple-300"
                      : "text-gray-400 hover:bg-[#121520] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-purple-400" : "text-gray-500"
                    }`}
                  />

                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar collapse control */}
          <div className="px-3 pt-1">
            <button
              type="button"
              onClick={() =>
                setCollapsed((current) => !current)
              }
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1C202C] px-3 py-2 text-xs text-gray-500 transition hover:bg-[#121520] hover:text-white"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  collapsed ? "" : "rotate-180"
                }`}
              />

              {!collapsed && <span>Collapse sidebar</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 border-t border-[#1C202C] p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-[#121520] hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-eyecap-cyan" />

            {!collapsed && <span>Live Storefront</span>}
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-950/20"
          >
            <LogOut className="h-4 w-4 shrink-0" />

            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1C202C] bg-[#0A0C12]/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded border border-purple-800/40 bg-purple-950/50 px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-widest text-purple-400 sm:text-xs">
              Admin Controller v2.6
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#1C202C] bg-[#121520] px-3 py-1.5 text-xs text-gray-300 sm:gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            <span className="max-w-40 truncate font-mono text-[10px] sm:max-w-none sm:text-[11px]">
              {user.firstName} {user.lastName} (Admin)
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}