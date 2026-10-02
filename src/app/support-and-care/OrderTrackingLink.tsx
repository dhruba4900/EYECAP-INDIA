"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function OrderTrackingLink() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <span
        aria-live="polite"
        className="inline-flex min-h-12 items-center rounded-2xl border border-eyecap-border px-6 py-3.5 text-sm text-eyecap-muted"
      >
        Checking your account...
      </span>
    );
  }

  return (
    <Link
      href={user ? "/account" : "/auth/login?redirect=/account"}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-eyecap-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eyecap-cyan"
    >
      {user ? "Go to my orders" : "Sign in to view orders"}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
