"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Award,
  Layers,
  Zap,
  Sliders,
  CheckCircle2,
  Eye,
  Star,
  ChevronRight,
} from "lucide-react";
import EyewearViewer from "@/components/3d/EyewearViewer";
import ProductCard from "@/components/shop/ProductCard";
import { formatCurrency } from "@/lib/utils";
import type { GraphicsConfig } from "@/lib/graphics";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [homepageContent, setHomepageContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 3D Hero Customizer State
  const [heroFrameColor, setHeroFrameColor] = useState("#22252A");
  const [heroLensColor, setHeroLensColor] = useState("#0F172A");
  const [heroModelType, setHeroModelType] = useState("geometric");

  useEffect(() => {
    async function loadData() {
      try {
        const [res, contentRes] = await Promise.all([
          fetch("/api/products?limit=8&featured=true"),
          fetch("/api/content/homepage"),
        ]);
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.products || []);
        }
        if (contentRes.ok) setHomepageContent(await contentRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getSection = (key: string) =>
    homepageContent?.sections?.find((section: any) => section.key === key);
  const isSectionEnabled = (key: string) => getSection(key)?.isEnabled !== false;

  const heroColors = [
    { name: "Stealth Obsidian", frame: "#181A20", lens: "#0F172A" },
    { name: "Sabae Titanium", frame: "#8E95A5", lens: "#1E293B" },
    { name: "24K Champagne", frame: "#D4AF37", lens: "#451A03" },
    { name: "Cyber Cyan", frame: "#0284C7", lens: "#020617" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. CINEMATIC HERO SECTION */}
      {isSectionEnabled("hero") && <section style={{ order: getSection("hero")?.displayOrder ?? 0, backgroundColor: getSection("hero")?.background || undefined }} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-eyecap-border/50 bg-gradient-radial from-eyecap-surface/40 via-eyecap-dark to-eyecap-dark">
        {getSection("hero")?.imageUrl && <img src={getSection("hero").imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
        {getSection("hero")?.imageUrl && <div className="absolute inset-0 bg-eyecap-dark/70" />}
        {/* Ambient Backlight Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-r from-eyecap-cyan/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-eyecap-gold/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text Column */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-eyecap-surface border border-eyecap-border text-xs text-eyecap-cyan font-mono tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getSection("hero")?.subtitle || "Series 2026 • Japanese Beta-Titanium"}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              {getSection("hero")?.title || <>SEE THE WORLD <br /><span className="text-gradient-cyan">DIFFERENTLY.</span></>}
            </h1>

            <p className="text-base sm:text-lg text-eyecap-silver max-w-xl font-light leading-relaxed">
              {getSection("hero")?.body || "Engineered for vision. Designed for you. Handcrafted in Sabae from aerospace-grade beta-titanium and fitted with Zeiss high-definition optical lenses."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={getSection("hero")?.ctaUrl || "/products"}
                className="px-8 py-4 rounded-full bg-white text-black font-semibold text-xs tracking-widest uppercase hover:bg-gray-200 transition-all shadow-xl shadow-white/10 flex items-center gap-2 group"
              >
                <span>{getSection("hero")?.ctaText || "Shop Collection"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products?category=titanium-luxury"
                className="px-8 py-4 rounded-full bg-eyecap-card border border-eyecap-border text-white font-semibold text-xs tracking-widest uppercase hover:border-gray-500 hover:bg-eyecap-surface transition-all flex items-center gap-2"
              >
                <span>Explore Titanium</span>
              </Link>
            </div>

            {/* Micro Specs Ticker */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-eyecap-border/60 w-full max-w-md">
              <div>
                <p className="text-2xl font-bold font-mono text-white">14.8g</p>
                <p className="text-[11px] text-eyecap-muted uppercase font-mono">Ultralight Frame</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-eyecap-cyan">100%</p>
                <p className="text-[11px] text-eyecap-muted uppercase font-mono">UV400 Polarized</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-white">0-Screw</p>
                <p className="text-[11px] text-eyecap-muted uppercase font-mono">Flex Cylinders</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Model Viewer & Real-Time Color Customizer */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full relative">
              <EyewearViewer
                modelType={heroModelType}
                frameColor={heroFrameColor}
                lensColor={heroLensColor}
                graphics={homepageContent?.graphics as GraphicsConfig | undefined}
                className="w-full h-[440px] sm:h-[500px]"
              />

              {/* Real-time Material & Silhouette Switcher HUD */}
              <div className="mt-4 p-4 rounded-xl bg-eyecap-surface/90 border border-eyecap-border backdrop-blur-md flex flex-wrap items-center justify-between gap-4 w-full">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-eyecap-muted block mb-1.5">
                    Frame Geometry
                  </span>
                  <div className="flex gap-1.5">
                    {["geometric", "aviator", "rectangular", "smart_audio"].map((shape) => (
                      <button
                        key={shape}
                        onClick={() => setHeroModelType(shape)}
                        className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded border transition-colors ${
                          heroModelType === shape
                            ? "border-eyecap-cyan text-eyecap-cyan bg-eyecap-cyan/10"
                            : "border-eyecap-border text-eyecap-silver hover:text-white"
                        }`}
                      >
                        {shape.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-eyecap-muted block mb-1.5">
                    Material Finish
                  </span>
                  <div className="flex items-center gap-2">
                    {heroColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setHeroFrameColor(c.frame);
                          setHeroLensColor(c.lens);
                        }}
                        title={c.name}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          heroFrameColor === c.frame
                            ? "border-eyecap-cyan scale-110 shadow-lg shadow-eyecap-cyan/30"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.frame }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>}

      {/* 2. FOUR CORE INNOVATION CATEGORIES */}
      {isSectionEnabled("categories") && <section style={{ order: getSection("categories")?.displayOrder ?? 1, backgroundColor: getSection("categories")?.background || undefined }} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
              Architectural Divisions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              {getSection("categories")?.title || "Curated Optical Collections"}
            </h2>
            {getSection("categories")?.subtitle && <p className="mt-2 max-w-xl text-sm text-eyecap-silver">{getSection("categories").subtitle}</p>}
          </div>
          <Link
            href={getSection("categories")?.ctaUrl || "/products"}
            className="text-xs font-mono uppercase tracking-widest text-eyecap-silver hover:text-white flex items-center gap-1.5 mt-4 md:mt-0 transition-colors"
          >
            <span>{getSection("categories")?.ctaText || "View All 24 Frames"}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Titanium Luxury",
              slug: "titanium-luxury",
              tag: "Aerospace Beta-Titanium",
              weight: "Sub-15 grams",
              image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
              desc: "Carved from Japanese beta-titanium monoblocks with zero solder welds.",
            },
            {
              title: "Sun & Polarized",
              slug: "sun-polarized",
              tag: "Zeiss Optical Shield",
              weight: "Category 3 & 4 Polarized",
              image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
              desc: "Complete 100% UV400 filtration with hydro-oleophobic anti-reflective coatings.",
            },
            {
              title: "BlueBlock Digital",
              slug: "blueblock-digital",
              tag: "Engineered for Screens",
              weight: "Zero Color Distortion",
              image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80",
              desc: "High transmission 450nm harmonic filtering for marathon coding and creative work.",
            },
            {
              title: "CyberTech Smart Audio",
              slug: "cybertech-smart-audio",
              tag: "Directional Acoustics",
              weight: "Bluetooth 5.4 Spatial",
              image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80",
              desc: "Open-ear directional sound drivers hidden within luxury sculpted temples.",
            },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-eyecap-card border border-eyecap-border/70 hover:border-eyecap-border transition-all duration-300 flex flex-col justify-end p-6 h-96 hover:shadow-2xl"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-75 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-eyecap-dark via-eyecap-dark/60 to-transparent" />

              <div className="relative z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan bg-eyecap-dark/80 px-2 py-0.5 rounded border border-eyecap-border inline-block mb-2">
                  {cat.tag}
                </span>
                <h3 className="text-xl font-bold text-white group-hover:text-eyecap-cyan transition-colors mb-1.5">
                  {cat.title}
                </h3>
                <p className="text-xs text-eyecap-silver line-clamp-2 mb-4 leading-relaxed">
                  {cat.desc}
                </p>
                <div className="flex items-center text-xs font-semibold text-white gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore Frames</span>
                  <ArrowRight className="w-3.5 h-3.5 text-eyecap-cyan" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>}

      {/* 3. FEATURED PRODUCTS SHOWCASE */}
      {isSectionEnabled("featured") && <section style={{ order: getSection("featured")?.displayOrder ?? 2, backgroundColor: getSection("featured")?.background || undefined }} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-eyecap-border/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
              High-Precision Lineup
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
              {getSection("featured")?.title || "Featured Eyewear"}
            </h2>
            {getSection("featured")?.subtitle && <p className="mt-2 text-sm text-eyecap-silver">{getSection("featured").subtitle}</p>}
          </div>
          <Link
            href="/products"
            className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan hover:underline mt-4 sm:mt-0"
          >
            {getSection("featured")?.ctaText || "Explore Complete Catalog"} →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border/50"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>}

      {isSectionEnabled("latest") && homepageContent?.posts?.length > 0 && (
        <section style={{ order: getSection("latest")?.displayOrder ?? 3 }} className="w-full border-t border-eyecap-border/60 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">Latest from EYECAP</span>
                <h2 className="mt-1 text-3xl font-bold text-white">{getSection("latest")?.title || "What’s New"}</h2>
                {getSection("latest")?.subtitle && <p className="mt-2 text-sm text-eyecap-silver">{getSection("latest").subtitle}</p>}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {homepageContent.posts.map((post: any) => (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-eyecap-border bg-eyecap-card">
                  {post.coverImage && <img src={post.coverImage} alt={post.title} className="h-56 w-full object-cover" />}
                  <div className="space-y-3 p-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan">{post.type}</p>
                    <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                    {post.subtitle && <p className="text-sm text-eyecap-silver">{post.subtitle}</p>}
                    <p className="line-clamp-3 text-sm leading-relaxed text-eyecap-silver">{post.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. THE METALLURGY & CRAFT SECTION */}
      {isSectionEnabled("craftsmanship") && <section style={{ order: getSection("craftsmanship")?.displayOrder ?? 4, backgroundColor: getSection("craftsmanship")?.background || undefined }} className="py-24 bg-eyecap-surface/40 border-y border-eyecap-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-gold">
                {getSection("craftsmanship")?.subtitle || "Japanese Beta-Titanium"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {getSection("craftsmanship")?.title || <>Forged at 1,668°C. <br />Finished by Master Artisans.</>}
              </h2>
              <p className="text-sm text-eyecap-silver leading-relaxed font-light">
                {getSection("craftsmanship")?.body || "In Fukui Prefecture, Japan, optical metallurgists have refined the craft of titanium cold-forging for over 100 years. EYECAP frames undergo 250 individual manufacturing steps—from micro-wire EDM electro-discharge machining to five-day hand tumbler polishing in organic walnut shells."}
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Hypoallergenic & Biocompatible Grade 5 Beta-Titanium",
                  "Patented screwless flex-cylinder hinge mechanism",
                  "Diamond-like Carbon (DLC) physical vapor deposition",
                  "Air-cushion medical grade silicone nose pads",
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-eyecap-cyan shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80"
                alt="Artisan craftsmanship"
                className="rounded-2xl object-cover h-64 sm:h-80 w-full border border-eyecap-border"
              />
              <img
                src="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80"
                alt="Optics testing"
                className="rounded-2xl object-cover h-64 sm:h-80 w-full border border-eyecap-border mt-8"
              />
            </div>
          </div>
        </div>
      </section>}

      {/* 5. VERIFIED CUSTOMER TESTIMONIALS */}
      <section style={{ order: 5 }} className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
            Testimonials
          </span>
          <h2 className="text-3xl font-bold text-white mt-1">Worn by Discerning Visionaries</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "The Chronos Alpha is ridiculously light. I forget I am wearing glasses during 10-hour coding sessions, and the titanium finish has stayed immaculate.",
              author: "Elena Rostova",
              role: "Principal AI Architect, San Francisco",
              rating: 5,
            },
            {
              quote: "I've owned Mykita, Lindberg, and Matsuda. EYECAP's hinge tolerance and zero-tint BlueBlock lenses are the finest optical engineering on the market today.",
              author: "Julian Chen",
              role: "Creative Director, Tokyo",
              rating: 5,
            },
            {
              quote: "The OTP delivery process was brilliant. Courier arrived, validated the code directly on the portal, and the luxury presentation case is worthy of haute horlogerie.",
              author: "Marcus Sterling",
              role: "Fintech Executive, London",
              rating: 5,
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-eyecap-card border border-eyecap-border/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(t.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-eyecap-silver italic leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.author}</p>
                <p className="text-xs text-eyecap-muted">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
