"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, logout } = useAuth();
  const { itemCount, setIsDrawerOpen } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [brand, setBrand] = useState<{
    logoUrl: string | null;
    siteName: string;
  }>({
    logoUrl: null,
    siteName: "EYECAP",
  });

  /* ============================================================
     BRANDING
  ============================================================ */

  useEffect(() => {
    const updateBrand = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          logoUrl: string | null;
          siteName: string;
        }>
      ).detail;

      if (detail) {
        setBrand(detail);
      }
    };

    window.addEventListener("eyecap:branding", updateBrand);

    return () => {
      window.removeEventListener("eyecap:branding", updateBrand);
    };
  }, []);

  /* ============================================================
     HIDE CUSTOMER NAVBAR ON ADMIN / DELIVERY
  ============================================================ */

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/delivery")
  ) {
    return null;
  }

  /* ============================================================
     NAVIGATION
     
     NOTE:
     These category slugs must match your actual database
     category slugs. We can connect them to the Admin Panel later.
  ============================================================ */


const navLinks = [
  {
    label: "ALL COLLECTIONS",
    href: "/products",
  },
  {
    label: "EYEGLASSES",
    href: "/products?category=eyeglasses",
  },
  {
    label: "SUNGLASSES",
    href: "/products?category=sunglasses",
  },
  {
    label: "CONTACT LENSES",
    href: "/products?category=contact-lenses",
  },
  {
    label: "SPECIAL POWER",
    href: "/products?category=special-power",
  },
  {
    label: "SPECIAL EDITIONS",
    href: "/special-editions",
  },
  {
    label: "ABOUT",
    href: "/about",
  },
  {
    label: "SUPPORT & CARE",
    href: "/support",
  },
];


  /* ============================================================
     ACTIVE NAVIGATION
  ============================================================ */

  const isActive = (href: string) => {
    const [basePath, queryString] = href.split("?");

    /* Normal page */
    if (!queryString) {
      if (basePath === "/products") {
        return (
          pathname === "/products" &&
          !searchParams.get("category")
        );
      }

      return (
        pathname === basePath ||
        pathname.startsWith(`${basePath}/`)
      );
    }

    /* Product category */
    const params = new URLSearchParams(queryString);
    const category = params.get("category");

    return (
      pathname === "/products" &&
      searchParams.get("category") === category
    );
  };

  /* ============================================================
     CLOSE MOBILE MENU
  ============================================================ */

  const handleMobileNavigation = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================
          MAIN NAVBAR
      ========================================================= */}

      <header className="sticky top-0 z-40 w-full border-b border-eyecap-border/50 bg-eyecap-dark/90 backdrop-blur-2xl">

        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">

          <div className="flex min-h-[76px] items-center justify-between gap-5">

            {/* ==================================================
                BRAND
            ================================================== */}

            <Link
              href="/"
              className="group flex shrink-0 items-center gap-3"
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.siteName}
                  className="h-9 w-9 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-eyecap-cyan to-blue-600 shadow-lg shadow-eyecap-cyan/20 transition-transform duration-200 group-hover:scale-105">
                  <span className="text-lg font-black tracking-tighter text-black">
                    E
                  </span>
                </div>
              )}

              <div className="hidden flex-col sm:flex">
                <span className="text-lg font-bold leading-none tracking-[0.18em] text-white xl:text-xl">
                  {brand.siteName}
                </span>

                <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.28em] text-eyecap-muted xl:text-[9px]">
                  Haute Optique
                </span>
              </div>
            </Link>

            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <nav className="hidden flex-1 items-center justify-center xl:flex">
              <div className="flex items-center gap-x-5 2xl:gap-x-7">

                {navLinks.map((link) => {
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={`${link.label}-${link.href}`}
                      href={link.href}
                      className={`
                        relative
                        whitespace-nowrap
                        py-2
                        text-[10px]
                        font-medium
                        uppercase
                        tracking-[0.12em]
                        transition-all
                        duration-200
                        2xl:text-[11px]
                        ${
                          active
                            ? "text-eyecap-cyan"
                            : "text-gray-300 hover:text-white"
                        }
                      `}
                    >
                      {link.label}

                      {active && (
                        <span className="absolute -bottom-0.5 left-0 right-0 mx-auto h-px bg-eyecap-cyan shadow-[0_0_8px_rgba(34,211,238,0.65)]" />
                      )}
                    </Link>
                  );
                })}

              </div>
            </nav>

            {/* ==================================================
                RIGHT SIDE ACTIONS
            ================================================== */}

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

              {/* SEARCH */}

              <Link
                href="/products"
                title="Search Catalog"
                aria-label="Search Catalog"
                className="rounded-full p-2.5 text-gray-300 transition-colors hover:bg-eyecap-card hover:text-white"
              >
                <Search className="h-[18px] w-[18px]" />
              </Link>

              {/* CART */}

              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="View Shopping Bag"
                className="relative rounded-full p-2.5 text-gray-300 transition-colors hover:bg-eyecap-card hover:text-white"
              >
                <ShoppingBag className="h-[18px] w-[18px]" />

                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-eyecap-cyan to-blue-500 px-1 text-[9px] font-bold text-black shadow-md">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* ==================================================
                  USER ACCOUNT
              ================================================== */}

              <div className="relative hidden sm:block">

                {user ? (
                  <button
                    type="button"
                    onClick={() =>
                      setUserDropdownOpen(!userDropdownOpen)
                    }
                    className="flex items-center gap-2 rounded-full border border-eyecap-border bg-eyecap-card py-1.5 pl-2 pr-3 transition-colors hover:border-gray-600"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-eyecap-cyan/20 text-xs font-bold text-eyecap-cyan">
                      {user.firstName?.[0] || "U"}
                    </div>

                    <span className="hidden text-xs font-medium text-gray-200 lg:inline">
                      {user.firstName}
                    </span>

                    <ChevronDown className="h-3.5 w-3.5 text-eyecap-muted" />
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-gray-200"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}

                {/* ==================================================
                    USER DROPDOWN
                ================================================== */}

                {userDropdownOpen && user && (
                  <div
                    onMouseLeave={() =>
                      setUserDropdownOpen(false)
                    }
                    className="absolute right-0 top-full z-50 mt-3 w-56 animate-in slide-in-from-top-2 rounded-2xl border border-eyecap-border bg-eyecap-surface p-2 shadow-2xl fade-in duration-150"
                  >

                    {/* User Information */}

                    <div className="mb-1 border-b border-eyecap-border/60 px-3 py-2.5">

                      <p className="text-xs font-semibold text-white">
                        {user.firstName} {user.lastName}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-eyecap-muted">
                        {user.email}
                      </p>

                      <span className="mt-2 inline-block rounded border border-eyecap-border bg-eyecap-card px-1.5 py-0.5 font-mono text-[9px] text-eyecap-cyan">
                        ROLE: {user.role}
                      </span>

                    </div>

                    {/* Account */}

                    <Link
                      href="/account"
                      onClick={() =>
                        setUserDropdownOpen(false)
                      }
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-gray-300 transition-colors hover:bg-eyecap-card hover:text-white"
                    >
                      <User className="h-4 w-4 text-eyecap-silver" />
                      Account & Orders
                    </Link>

                    {/* Logout */}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-rose-400 transition-colors hover:bg-rose-950/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>

                  </div>
                )}

              </div>

              {/* ==================================================
                  MOBILE MENU BUTTON
              ================================================== */}

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="rounded-full p-2.5 text-gray-300 transition-colors hover:bg-eyecap-card hover:text-white xl:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

            </div>

          </div>

          {/* ======================================================
              MOBILE NAVIGATION
          ======================================================= */}

          {mobileMenuOpen && (
            <div className="border-t border-eyecap-border/50 py-5 xl:hidden">

              <nav className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">

                {navLinks.map((link) => {
                  const active = isActive(link.href);

                  return (
                    <Link
                      key={`mobile-${link.label}-${link.href}`}
                      href={link.href}
                      onClick={handleMobileNavigation}
                      className={`
                        flex items-center justify-between
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-[0.12em]
                        transition-colors
                        ${
                          active
                            ? "border-eyecap-border bg-eyecap-card text-eyecap-cyan"
                            : "border-transparent text-gray-300 hover:bg-eyecap-card hover:text-white"
                        }
                      `}
                    >
                      <span>{link.label}</span>

                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-eyecap-cyan" />
                      )}
                    </Link>
                  );
                })}

              </nav>

              {/* Mobile Account */}

              <div className="mt-4 border-t border-eyecap-border/40 pt-4">

                {user ? (
                  <Link
                    href="/account"
                    onClick={handleMobileNavigation}
                    className="flex items-center gap-3 rounded-xl bg-eyecap-card px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-eyecap-cyan/20 text-sm font-bold text-eyecap-cyan">
                      {user.firstName?.[0] || "U"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {user.firstName} {user.lastName}
                      </p>

                      <p className="truncate text-[10px] text-eyecap-muted">
                        Account & Orders
                      </p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={handleMobileNavigation}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-gray-200"
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </Link>
                )}

              </div>

            </div>
          )}

        </div>

      </header>
    </>
  );
}