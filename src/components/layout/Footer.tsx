"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, Truck, RefreshCw, Award } from "lucide-react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/layout/BrandLogo";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/delivery")) {
    return null;
  }

  const features = [
    {
      icon: <Award className="w-5 h-5 text-eyecap-cyan" />,
      title: "Beta-Titanium Precision",
      desc: "Sub-16 gram frames forged in Sabae, Japan from aerospace titanium.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-eyecap-gold" />,
      title: "Zeiss Optical Standards",
      desc: "Hydro-oleophobic multi-coatings with certified UV400 suppression.",
    },
    {
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      title: "OTP Secure Courier Handover",
      desc: "Direct verification protocol prevents package loss or misplacement.",
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-purple-400" />,
      title: "30-Day Bespoke Guarantee",
      desc: "Complimentary return shipping and custom prescription refitting.",
    },
  ];

  return (
    <footer className="bg-eyecap-dark border-t border-eyecap-border/60 text-eyecap-silver">
      {/* Brand Pillars */}
      <div className="border-b border-eyecap-border/40 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="p-2.5 rounded-xl bg-eyecap-card border border-eyecap-border shrink-0">
                {f.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                <p className="text-xs text-eyecap-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Sitemap */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <BrandLogo className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold tracking-[0.2em] text-white">EYECAP</span>
          </Link>
          <p className="text-xs text-eyecap-muted leading-relaxed max-w-sm mb-6">
            EYECAP redefines vision architecture through aerospace metallurgy, computational acoustics, and bespoke lens design.
          </p>
          <div className="flex gap-2">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-eyecap-card border border-eyecap-border text-eyecap-cyan">
              SABAE • TOKYO • SAN FRANCISCO
            </span>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">Collections</h5>
          <ul className="space-y-2.5 text-xs text-eyecap-silver">
            <li><Link href="/products?category=titanium-luxury" className="hover:text-white transition-colors">Titanium Luxury</Link></li>
            <li><Link href="/products?category=sun-polarized" className="hover:text-white transition-colors">Sun & Polarized</Link></li>
            <li><Link href="/products?category=blueblock-digital" className="hover:text-white transition-colors">BlueBlock Digital</Link></li>
            <li><Link href="/products?category=cybertech-smart-audio" className="hover:text-white transition-colors">CyberTech Smart Audio</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">View All 24 Models</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">Customer Care</h5>
          <ul className="space-y-2.5 text-xs text-eyecap-silver">
            <li><Link href="/account" className="hover:text-white transition-colors">Customer Portal</Link></li>
            <li><Link href="/checkout" className="hover:text-white transition-colors">Order Checkout</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">Compliance</h5>
          <ul className="space-y-2.5 text-xs text-eyecap-silver">
            <li><span className="text-eyecap-muted">ISO 12312-1 Certified</span></li>
            <li><span className="text-eyecap-muted">FDA Optical Class 1</span></li>
            <li><span className="text-eyecap-muted">256-Bit TLS Security</span></li>
            <li><span className="text-eyecap-muted">Server OTP Handover</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-eyecap-border/40 py-6 px-4 text-center text-xs text-eyecap-muted">
        <p>© {new Date().getFullYear()} EYECAP Optical Technologies Inc. All rights reserved. Engineered for vision.</p>
      </div>
    </footer>
  );
}
