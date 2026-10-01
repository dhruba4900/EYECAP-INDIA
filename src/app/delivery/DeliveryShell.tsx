"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Truck, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/delivery");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center">
        <p className="text-xs text-gray-400">Redirecting to sign in…</p>
      </div>
    );
  }

  // If user is not delivery partner, show permission gate with quick-switch button
  if (user && user.role !== "DELIVERY_PARTNER") {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-eyecap-surface border border-emerald-900/50 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
            <Truck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Courier Partner Access Only</h2>
          <p className="text-xs text-eyecap-silver leading-relaxed">
            You are logged in as <span className="text-eyecap-cyan font-bold">{user.email}</span> with role <span className="font-mono text-amber-400">{user.role}</span>.
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

  return (
    <div className="min-h-screen bg-[#07090D] text-gray-200 flex flex-col">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-30 bg-[#0C1017]/90 backdrop-blur-md border-b border-[#1A2332] px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-white">EYECAP</span>
            <span className="block text-[9px] font-mono text-emerald-400 uppercase -mt-0.5 tracking-wider">
              Courier Partner Dispatch
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">{user?.firstName} {user?.lastName}</span>
            <span className="sm:hidden">Active</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Delivery Mobile-First Canvas */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
