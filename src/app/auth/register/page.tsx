"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await register(formData);
    setLoading(false);
    if (res.success) {
      router.push("/account");
    } else {
      setError(res.error || "Registration failed");
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
          <h1 className="text-xl font-bold text-white">Create Your Account</h1>
          <p className="text-xs text-eyecap-silver">Join the EYECAP bespoke vision network</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-eyecap-silver block mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
              />
            </div>
            <div>
              <label className="text-eyecap-silver block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
              />
            </div>
          </div>

          <div>
            <label className="text-eyecap-silver block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
            />
          </div>

          <div>
            <label className="text-eyecap-silver block mb-1">Phone Number (For Delivery OTP)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
            />
          </div>

          <div>
            <label className="text-eyecap-silver block mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? "Creating Profile..." : "Complete Registration"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-eyecap-muted">
          Already registered?{" "}
          <Link href="/auth/login" className="text-eyecap-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
