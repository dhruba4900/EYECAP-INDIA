"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect") || "/";
  const redirect = requestedRedirect.startsWith("/") &&
    !requestedRedirect.startsWith("//") &&
    !requestedRedirect.includes("\\")
    ? requestedRedirect
    : "/";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || "Authentication failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 min-h-[80vh] flex flex-col justify-center">
      <div className="p-8 rounded-3xl bg-eyecap-surface border border-eyecap-border shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-eyecap-cyan to-blue-600 flex items-center justify-center font-black text-black">
              E
            </div>
            <span className="text-lg font-bold tracking-[0.2em] text-white">EYECAP</span>
          </Link>
          <h1 className="text-xl font-bold text-white">Sign In to EYECAP</h1>
          <p className="text-xs text-eyecap-silver">Enter your account credentials to continue.</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-eyecap-silver block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-eyecap-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@eyecap.luxury"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
              />
            </div>
          </div>

          <div>
            <label className="text-eyecap-silver block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-eyecap-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-eyecap-muted">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-eyecap-cyan hover:underline">
            Register as Customer
          </Link>
        </p>
      </div>
    </div>
  );
}
