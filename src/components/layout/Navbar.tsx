"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { itemCount, setIsDrawerOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [brand, setBrand] = useState<{ logoUrl: string | null; siteName: string }>({
    logoUrl: null,
    siteName: "EYECAP",
  });

  useEffect(() => {
    const updateBrand = (event: Event) => {
      const detail = (event as CustomEvent<{ logoUrl: string | null; siteName: string }>).detail;
      setBrand(detail);
    };
    window.addEventListener("eyecap:branding", updateBrand);
    return () => window.removeEventListener("eyecap:branding", updateBrand);
  }, []);

  // If in admin or delivery route, we render their specialized headers instead
  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) {
    return null;
  }

  const navLinks = [
    { label: "COLLECTION", href: "/products" },
    { label: "TITANIUM LUXURY", href: "/products?category=titanium-luxury" },
    { label: "SUN & POLARIZED", href: "/products?category=sun-polarized" },
    { label: "BLUEBLOCK DIGITAL", href: "/products?category=blueblock-digital" },
    { label: "SMART AUDIO", href: "/products?category=cybertech-smart-audio" },
  ];

  return (
    <>
      {/* Main Luxury Navigation Bar */}
      <header className="sticky top-0 z-40 bg-eyecap-dark/85 backdrop-blur-xl border-b border-eyecap-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-eyecap-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-eyecap-cyan/20 group-hover:scale-105 transition-transform">
                <span className="font-black text-black text-lg tracking-tighter">E</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-[0.2em] text-white">{brand.siteName}</span>
              <span className="text-[9px] tracking-[0.3em] text-eyecap-muted -mt-1 font-mono uppercase">
                Haute Optique
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs font-medium tracking-widest uppercase transition-colors hover:text-white ${
                    active ? "text-eyecap-cyan font-semibold" : "text-gray-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Link
              href="/products"
              className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-eyecap-card transition-colors"
              title="Search Catalog"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 text-gray-300 hover:text-white rounded-full hover:bg-eyecap-card transition-colors"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-eyecap-cyan to-blue-500 text-black font-bold text-[10px] flex items-center justify-center shadow-md animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Auth */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-eyecap-card border border-eyecap-border hover:border-gray-600 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-eyecap-cyan/20 text-eyecap-cyan flex items-center justify-center font-bold text-xs">
                    {user.firstName[0]}
                  </div>
                  <span className="text-xs text-gray-200 font-medium hidden md:inline">
                    {user.firstName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-eyecap-muted" />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Account Dropdown Menu */}
              {userDropdownOpen && user && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-eyecap-surface border border-eyecap-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-eyecap-border/60 mb-1">
                    <p className="text-xs font-semibold text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-eyecap-muted truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-eyecap-card border border-eyecap-border font-mono text-eyecap-cyan">
                      ROLE: {user.role}
                    </span>
                  </div>

                  <Link
                    href="/account"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-eyecap-card rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-eyecap-silver" /> Account & Orders
                  </Link>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-eyecap-surface border-b border-eyecap-border px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium tracking-wider uppercase text-gray-200 hover:text-eyecap-cyan transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
