import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SecurityConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    if (auth.status === 401) {
      redirect("/auth/login?redirect=/security-console");
    }

    return (
      <main className="min-h-screen bg-[#07080B] p-8 flex flex-col items-center justify-center text-center text-white">
        <div className="max-w-md p-8 rounded-3xl bg-eyecap-surface border border-rose-900/60 shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-white">Super Administrator Privileges Required</h1>
          <p className="text-xs text-rose-300/80 leading-relaxed">
            The Security Console is strictly isolated to authorized Super Administrator accounts.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Store Admin</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] text-gray-200 font-sans">
      {/* Top Security Header */}
      <header className="sticky top-0 z-40 border-b border-rose-950/60 bg-[#0A0C12]/95 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/50">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] text-white">EYECAP SECURITY CONSOLE</span>
              <span className="rounded bg-rose-950/80 border border-rose-800/80 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-rose-400">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">Restricted Administrative Operations & Identity Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-gray-200">{auth.user.firstName} {auth.user.lastName}</span>
            <span className="text-[10px] font-mono text-cyan-400">{auth.user.email}</span>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:border-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Store Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
