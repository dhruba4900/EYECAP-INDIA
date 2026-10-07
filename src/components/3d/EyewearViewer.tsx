"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  Pause,
  Play,
} from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import type { GraphicsConfig } from "@/lib/graphics";
import type { Product } from "@/types/product";

type HeroSlide = {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  ctaText: string;
  ctaUrl: string;
  secondaryText: string;
  secondaryUrl: string;

  /**
   * Hero background
   */
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundPosterUrl?: string;

  /**
   * Foreground product / post image
   */
  productImageUrl?: string;
  productImageAlt?: string;
  productImageHref?: string;

  /**
   * Visual controls
   */
  accent: "cyan" | "silver" | "gold";
  overlayOpacity?: number;
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>([]);

  const [homepageContent, setHomepageContent] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  // Hero Slider State
  const [activeHeroSlide, setActiveHeroSlide] =
    useState(0);

  const [isHeroPaused, setIsHeroPaused] =
    useState(false);

  const [isHeroVisible, setIsHeroVisible] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [res, contentRes] = await Promise.all([
          fetch("/api/products?limit=8&featured=true"),
          fetch("/api/content/homepage"),
        ]);

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.products || []);
        }

        if (contentRes.ok) {
          setHomepageContent(await contentRes.json());
        }
      } catch (error) {
        console.error("Homepage data loading error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const getSection = (key: string) =>
    homepageContent?.sections?.find(
      (section: any) => section.key === key
    );

  const isSectionEnabled = (key: string) =>
    getSection(key)?.isEnabled !== false;

  /*
   * HERO SLIDES
   *
   * You can later connect these URLs with your Admin/CMS.
   *
   * backgroundImageUrl:
   *   Full-screen hero background image.
   *
   * backgroundVideoUrl:
   *   Full-screen hero background video.
   *
   * productImageUrl:
   *   Foreground eyewear/product photograph.
   *
   * If productImageUrl is not provided, the active featured
   * product image is automatically used.
   */
  const heroSlides: HeroSlide[] = [
    {
      eyebrow: "Series 2026 • Japanese Beta-Titanium",

      title: (
        <>
          SEE THE WORLD <br />
          <span className="text-gradient-cyan">
            DIFFERENTLY.
          </span>
        </>
      ),

      body:
        "Engineered for vision. Designed for you. Handcrafted in Sabae from aerospace-grade beta-titanium and fitted with Zeiss high-definition optical lenses.",

      ctaText: "Shop Collection",
      ctaUrl: "/products",

      secondaryText: "Explore Titanium",
      secondaryUrl:
        "/products?category=titanium-luxury",

      /*
       * Add your campaign background here when ready.
       *
       * Example:
       * backgroundImageUrl: "/uploads/hero/titanium.jpg",
       *
       * Or:
       * backgroundVideoUrl: "/uploads/hero/titanium.mp4",
       */

      backgroundImageUrl: undefined,
      backgroundVideoUrl: undefined,
      backgroundPosterUrl: undefined,

      /*
       * Optional dedicated foreground product image.
       *
       * If left undefined, the first featured product image
       * will automatically be used.
       */
      productImageUrl: undefined,
      productImageAlt: "EYECAP titanium eyewear",
      productImageHref: "/products",

      accent: "cyan",
      overlayOpacity: 0.68,
    },

    {
      eyebrow: "Optical Engineering • Zero Compromise",

      title: (
        <>
          ENGINEERED FOR <br />
          <span className="text-gradient-cyan">
            PRECISION.
          </span>
        </>
      ),

      body:
        "Ultra-light construction, precision-balanced geometry and high-definition optics engineered for long days without sacrificing presence.",

      ctaText: "Discover Engineering",
      ctaUrl:
        "/products?category=titanium-luxury",

      secondaryText: "View Frames",
      secondaryUrl: "/products",

      backgroundImageUrl: undefined,
      backgroundVideoUrl: undefined,
      backgroundPosterUrl: undefined,

      productImageUrl: undefined,
      productImageAlt: "EYECAP precision eyewear",
      productImageHref:
        "/products?category=titanium-luxury",

      accent: "silver",
      overlayOpacity: 0.68,
    },

    {
      eyebrow: "CyberTech • Next-Generation Eyewear",

      title: (
        <>
          VISION MEETS <br />
          <span className="text-gradient-cyan">
            INTELLIGENCE.
          </span>
        </>
      ),

      body:
        "A future-facing eyewear platform combining sculpted design, digital-first optics and smart audio concepts for the modern creator.",

      ctaText: "Explore CyberTech",
      ctaUrl:
        "/products?category=cybertech-smart-audio",

      secondaryText: "Explore Collection",
      secondaryUrl: "/products",

      backgroundImageUrl: undefined,
      backgroundVideoUrl: undefined,
      backgroundPosterUrl: undefined,

      productImageUrl: undefined,
      productImageAlt:
        "EYECAP CyberTech smart eyewear",
      productImageHref:
        "/products?category=cybertech-smart-audio",

      accent: "cyan",
      overlayOpacity: 0.68,
    },
  ];

  const goToHeroSlide = useCallback(
    (index: number) => {
      const next =
        (index + heroSlides.length) %
        heroSlides.length;

      setActiveHeroSlide(next);
    },
    [heroSlides.length]
  );

  /*
   * Pause autoplay when the hero is not visible.
   */
  useEffect(() => {
    const heroElement =
      document.querySelector(
        '[aria-label="EYECAP featured collection"]'
      );

    if (!heroElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(heroElement);

    return () => observer.disconnect();
  }, []);

  /*
   * Automatic hero transition.
   */
  useEffect(() => {
    if (isHeroPaused || !isHeroVisible) return;

    const timer = window.setInterval(() => {
      setActiveHeroSlide(
        (current) =>
          (current + 1) % heroSlides.length
      );
    }, 6500);

    return () => window.clearInterval(timer);
  }, [
    isHeroPaused,
    isHeroVisible,
    heroSlides.length,
  ]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goToHeroSlide(activeHeroSlide - 1);
      }

      if (event.key === "ArrowRight") {
        goToHeroSlide(activeHeroSlide + 1);
      }

      if (event.key === " ") {
        const target =
          event.target as HTMLElement | null;

        const isTyping =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable;

        if (!isTyping) {
          event.preventDefault();
          setIsHeroPaused((paused) => !paused);
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [activeHeroSlide, goToHeroSlide]);

  const activeSlide =
    heroSlides[activeHeroSlide];

  /*
   * Automatically use the active featured product
   * as the foreground product image.
   *
   * Slide 0 -> featuredProducts[0]
   * Slide 1 -> featuredProducts[1]
   * Slide 2 -> featuredProducts[2]
   */
  const activeProduct =
    featuredProducts[activeHeroSlide] ||
    featuredProducts[0];

  const foregroundProductImage =
    activeSlide.productImageUrl ||
    activeProduct?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=90";

  const foregroundProductAlt =
    activeSlide.productImageAlt ||
    activeProduct?.images?.[0]?.alt ||
    activeProduct?.name ||
    "EYECAP eyewear";

  /*
   * Background image:
   *
   * 1. Slide-specific background
   * 2. Admin homepage hero image
   * 3. No background image
   */
  const heroBackgroundImage =
    activeSlide.backgroundImageUrl ||
    getSection("hero")?.imageUrl;

  /*
   * Background video has priority over background image.
   */
  const heroBackgroundVideo =
    activeSlide.backgroundVideoUrl;

  const heroOverlayOpacity =
    activeSlide.overlayOpacity ?? 0.68;

  return (
    <div className="flex flex-col min-h-screen">
      {/* =========================================================
          1. CINEMATIC HERO SLIDER
         ========================================================= */}
      {isSectionEnabled("hero") && (
        <section
          style={{
            order:
              getSection("hero")?.displayOrder ??
              0,
            backgroundColor:
              getSection("hero")?.background ||
              undefined,
          }}
          className="relative min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-eyecap-border/50 bg-gradient-radial from-eyecap-surface/40 via-eyecap-dark to-eyecap-dark"
          aria-roledescription="carousel"
          aria-label="EYECAP featured collection"
        >
          {/* =====================================================
              HERO BACKGROUND MEDIA
             ===================================================== */}

          {heroBackgroundVideo ? (
            <video
              key={heroBackgroundVideo}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={
                activeSlide.backgroundPosterUrl ||
                heroBackgroundImage ||
                undefined
              }
              aria-hidden="true"
            >
              <source
                src={heroBackgroundVideo}
                type="video/mp4"
              />
            </video>
          ) : heroBackgroundImage ? (
            <img
              key={heroBackgroundImage}
              src={heroBackgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}

          {/* =====================================================
              BACKGROUND DARKENING / CINEMATIC OVERLAY
             ===================================================== */}

          <div
            className="absolute inset-0 bg-eyecap-dark"
            style={{
              opacity: heroBackgroundImage ||
                heroBackgroundVideo
                ? heroOverlayOpacity
                : 1,
            }}
          />

          {/* Left-to-right readability gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-eyecap-dark via-eyecap-dark/70 to-transparent pointer-events-none" />

          {/* Bottom cinematic fade */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-eyecap-dark to-transparent pointer-events-none" />

          {/* Ambient Backlight Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-r from-eyecap-cyan/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

          <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-eyecap-gold/10 blur-[120px] pointer-events-none rounded-full" />

          {/* =====================================================
              HERO CONTENT
             ===================================================== */}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* =================================================
                  LEFT TEXT COLUMN
                 ================================================= */}

              <div
                key={`hero-copy-${activeHeroSlide}`}
                className="lg:col-span-6 flex flex-col items-start space-y-6 animate-in fade-in slide-in-from-left-4 duration-500"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-eyecap-surface/90 border border-eyecap-border text-xs text-eyecap-cyan font-mono tracking-wider uppercase backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />

                  <span>
                    {activeHeroSlide === 0
                      ? getSection("hero")?.subtitle ||
                        activeSlide.eyebrow
                      : activeSlide.eyebrow}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                  {activeHeroSlide === 0
                    ? getSection("hero")?.title ||
                      activeSlide.title
                    : activeSlide.title}
                </h1>

                <p className="text-base sm:text-lg text-eyecap-silver max-w-xl font-light leading-relaxed">
                  {activeHeroSlide === 0
                    ? getSection("hero")?.body ||
                      activeSlide.body
                    : activeSlide.body}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={activeSlide.ctaUrl}
                    className="px-8 py-4 rounded-full bg-white text-black font-semibold text-xs tracking-widest uppercase hover:bg-gray-200 transition-all shadow-xl shadow-white/10 flex items-center gap-2 group"
                  >
                    <span>
                      {activeSlide.ctaText}
                    </span>

                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href={activeSlide.secondaryUrl}
                    className="px-8 py-4 rounded-full bg-eyecap-card/90 border border-eyecap-border text-white font-semibold text-xs tracking-widest uppercase hover:border-gray-500 hover:bg-eyecap-surface transition-all flex items-center gap-2 backdrop-blur-md"
                  >
                    <span>
                      {activeSlide.secondaryText}
                    </span>
                  </Link>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-eyecap-border/60 w-full max-w-md">
                  <div>
                    <p className="text-2xl font-bold font-mono text-white">
                      14.8g
                    </p>

                    <p className="text-[11px] text-eyecap-muted uppercase font-mono">
                      Ultralight Frame
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold font-mono text-eyecap-cyan">
                      100%
                    </p>

                    <p className="text-[11px] text-eyecap-muted uppercase font-mono">
                      UV400 Polarized
                    </p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold font-mono text-white">
                      0-Screw
                    </p>

                    <p className="text-[11px] text-eyecap-muted uppercase font-mono">
                      Flex Cylinders
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  RIGHT COLUMN
                  REAL PRODUCT / POST IMAGE
                 ================================================= */}

              <div
                key={`hero-product-${activeHeroSlide}`}
                className="lg:col-span-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500"
              >
                <div className="w-full relative">

                  {/* Product Showcase Frame */}

                  <div className="relative w-full h-[400px] sm:h-[470px] lg:h-[500px] rounded-[2rem] overflow-hidden border border-white/10 bg-eyecap-surface/20 backdrop-blur-sm shadow-2xl shadow-black/30">

                    {/* Product image glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-eyecap-cyan/10 via-transparent to-transparent pointer-events-none" />

                    {/* Product image */}
                    <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-10">
                      {activeSlide.productImageHref ? (
                        <Link
                          href={
                            activeSlide.productImageHref
                          }
                          className="relative w-full h-full flex items-center justify-center group"
                        >
                          <img
                            key={foregroundProductImage}
                            src={foregroundProductImage}
                            alt={foregroundProductAlt}
                            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          />

                          {/* Product image shine */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </Link>
                      ) : (
                        <img
                          key={foregroundProductImage}
                          src={foregroundProductImage}
                          alt={foregroundProductAlt}
                          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_30px_45px_rgba(0,0,0,0.55)]"
                        />
                      )}
                    </div>

                    {/* Product badge */}
                    <div className="absolute top-5 left-5 z-20">
                      <span className="inline-flex items-center gap-2 rounded-full bg-eyecap-dark/75 border border-white/10 backdrop-blur-md px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan">
                        <Eye className="w-3 h-3" />
                        Studio Product
                      </span>
                    </div>

                    {/* Product information */}
                    {activeProduct?.name && (
                      <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-mono text-eyecap-cyan mb-1">
                            Featured Frame
                          </p>

                          <h3 className="text-lg sm:text-xl font-semibold text-white">
                            {activeProduct.name}
                          </h3>

                          {activeProduct.frameMaterial && (
                            <p className="text-xs text-eyecap-silver mt-1">
                              {activeProduct.frameMaterial}
                            </p>
                          )}
                        </div>

                        <Link
                          href={
                            activeSlide.productImageHref ||
                            `/products/${activeProduct.slug}`
                          }
                          className="shrink-0 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                          aria-label="View product"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================
                SLIDER CONTROLS
               =================================================== */}

            <div
              className="mt-8 flex items-center justify-between gap-4"
              role="group"
              aria-label="Hero slider controls"
            >
              <div className="flex items-center gap-2">
                {heroSlides.map(
                  (slide, index) => (
                    <button
                      key={slide.eyebrow}
                      onClick={() =>
                        goToHeroSlide(index)
                      }
                      aria-label={`Go to hero slide ${
                        index + 1
                      }`}
                      aria-current={
                        index === activeHeroSlide
                          ? "true"
                          : undefined
                      }
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === activeHeroSlide
                          ? "w-10 bg-eyecap-cyan"
                          : "w-5 bg-eyecap-border hover:bg-eyecap-silver"
                      }`}
                    />
                  )
                )}

                <span className="ml-2 text-[10px] font-mono text-eyecap-muted">
                  0{activeHeroSlide + 1} / 0
                  {heroSlides.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setIsHeroPaused(
                      (paused) => !paused
                    )
                  }
                  aria-label={
                    isHeroPaused
                      ? "Resume hero slider"
                      : "Pause hero slider"
                  }
                  className="w-9 h-9 rounded-full border border-eyecap-border text-eyecap-silver hover:text-white hover:border-eyecap-cyan transition-colors flex items-center justify-center"
                >
                  {isHeroPaused ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() =>
                    goToHeroSlide(
                      activeHeroSlide - 1
                    )
                  }
                  aria-label="Previous hero slide"
                  className="w-9 h-9 rounded-full border border-eyecap-border text-eyecap-silver hover:text-white hover:border-eyecap-cyan transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    goToHeroSlide(
                      activeHeroSlide + 1
                    )
                  }
                  aria-label="Next hero slide"
                  className="w-9 h-9 rounded-full border border-eyecap-border text-eyecap-silver hover:text-white hover:border-eyecap-cyan transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          2. FOUR CORE INNOVATION CATEGORIES
         ========================================================= */}

      {isSectionEnabled("categories") && (
        <section
          style={{
            order:
              getSection("categories")
                ?.displayOrder ?? 1,
            backgroundColor:
              getSection("categories")
                ?.background || undefined,
          }}
          className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
                Architectural Divisions
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
                {getSection("categories")?.title ||
                  "Curated Optical Collections"}
              </h2>

              {getSection("categories")
                ?.subtitle && (
                <p className="mt-2 max-w-xl text-sm text-eyecap-silver">
                  {
                    getSection("categories")
                      .subtitle
                  }
                </p>
              )}
            </div>

            <Link
              href={
                getSection("categories")
                  ?.ctaUrl || "/products"
              }
              className="text-xs font-mono uppercase tracking-widest text-eyecap-silver hover:text-white flex items-center gap-1.5 mt-4 md:mt-0 transition-colors"
            >
              <span>
                {getSection("categories")
                  ?.ctaText ||
                  "View All 24 Frames"}
              </span>

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
                image:
                  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
                desc:
                  "Carved from Japanese beta-titanium monoblocks with zero solder welds.",
              },
              {
                title: "Sun & Polarized",
                slug: "sun-polarized",
                tag: "Zeiss Optical Shield",
                weight:
                  "Category 3 & 4 Polarized",
                image:
                  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
                desc:
                  "Complete 100% UV400 filtration with hydro-oleophobic anti-reflective coatings.",
              },
              {
                title: "BlueBlock Digital",
                slug: "blueblock-digital",
                tag: "Engineered for Screens",
                weight:
                  "Zero Color Distortion",
                image:
                  "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=800&q=80",
                desc:
                  "High transmission 450nm harmonic filtering for marathon coding and creative work.",
              },
              {
                title:
                  "CyberTech Smart Audio",
                slug:
                  "cybertech-smart-audio",
                tag: "Directional Acoustics",
                weight:
                  "Bluetooth 5.4 Spatial",
                image:
                  "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80",
                desc:
                  "Open-ear directional sound drivers hidden within luxury sculpted temples.",
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
                    <span>
                      Explore Frames
                    </span>

                    <ArrowRight className="w-3.5 h-3.5 text-eyecap-cyan" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          3. FEATURED PRODUCTS
         ========================================================= */}

      {isSectionEnabled("featured") && (
        <section
          style={{
            order:
              getSection("featured")
                ?.displayOrder ?? 2,
            backgroundColor:
              getSection("featured")
                ?.background || undefined,
          }}
          className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-eyecap-border/60"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
                High-Precision Lineup
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                {getSection("featured")?.title ||
                  "Featured Eyewear"}
              </h2>

              {getSection("featured")
                ?.subtitle && (
                <p className="mt-2 text-sm text-eyecap-silver">
                  {
                    getSection("featured")
                      .subtitle
                  }
                </p>
              )}
            </div>

            <Link
              href="/products"
              className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan hover:underline mt-4 sm:mt-0"
            >
              {getSection("featured")
                ?.ctaText ||
                "Explore Complete Catalog"}{" "}
              →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                1, 2, 3, 4, 5, 6, 7, 8,
              ].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border/50"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          4. LATEST
         ========================================================= */}

      {isSectionEnabled("latest") &&
        homepageContent?.posts?.length > 0 && (
          <section
            style={{
              order:
                getSection("latest")
                  ?.displayOrder ?? 3,
            }}
            className="w-full border-t border-eyecap-border/60 px-4 py-20 sm:px-6 lg:px-8"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
                    Latest from EYECAP
                  </span>

                  <h2 className="mt-1 text-3xl font-bold text-white">
                    {getSection("latest")
                      ?.title ||
                      "What’s New"}
                  </h2>

                  {getSection("latest")
                    ?.subtitle && (
                    <p className="mt-2 text-sm text-eyecap-silver">
                      {
                        getSection("latest")
                          .subtitle
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {homepageContent.posts.map(
                  (post: any) => (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-2xl border border-eyecap-border bg-eyecap-card"
                    >
                      {post.coverImage && (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-56 w-full object-cover"
                        />
                      )}

                      <div className="space-y-3 p-5">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan">
                          {post.type}
                        </p>

                        <h3 className="text-xl font-semibold text-white">
                          {post.title}
                        </h3>

                        {post.subtitle && (
                          <p className="text-sm text-eyecap-silver">
                            {post.subtitle}
                          </p>
                        )}

                        <p className="line-clamp-3 text-sm leading-relaxed text-eyecap-silver">
                          {post.description}
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>
          </section>
        )}

      {/* =========================================================
          5. CRAFTSMANSHIP
         ========================================================= */}

      {isSectionEnabled("craftsmanship") && (
        <section
          style={{
            order:
              getSection("craftsmanship")
                ?.displayOrder ?? 4,
            backgroundColor:
              getSection("craftsmanship")
                ?.background || undefined,
          }}
          className="py-24 bg-eyecap-surface/40 border-y border-eyecap-border relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-mono uppercase tracking-widest text-eyecap-gold">
                  {getSection(
                    "craftsmanship"
                  )?.subtitle ||
                    "Japanese Beta-Titanium"}
                </span>

                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {getSection(
                    "craftsmanship"
                  )?.title || (
                    <>
                      Forged at 1,668°C. <br />
                      Finished by Master Artisans.
                    </>
                  )}
                </h2>

                <p className="text-sm text-eyecap-silver leading-relaxed font-light">
                  {getSection(
                    "craftsmanship"
                  )?.body ||
                    "In Fukui Prefecture, Japan, optical metallurgists have refined the craft of titanium cold-forging for over 100 years. EYECAP frames undergo 250 individual manufacturing steps—from micro-wire EDM electro-discharge machining to five-day hand tumbler polishing in organic walnut shells."}
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    "Hypoallergenic & Biocompatible Grade 5 Beta-Titanium",
                    "Patented screwless flex-cylinder hinge mechanism",
                    "Diamond-like Carbon (DLC) physical vapor deposition",
                    "Air-cushion medical grade silicone nose pads",
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 text-xs text-gray-200"
                    >
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
        </section>
      )}

      {/* =========================================================
          6. VERIFIED CUSTOMER TESTIMONIALS
         ========================================================= */}

      <section
        style={{ order: 5 }}
        className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
            Testimonials
          </span>

          <h2 className="text-3xl font-bold text-white mt-1">
            Worn by Discerning Visionaries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote:
                "The Chronos Alpha is ridiculously light. I forget I am wearing glasses during 10-hour coding sessions, and the titanium finish has stayed immaculate.",
              author: "Elena Rostova",
              role:
                "Principal AI Architect, San Francisco",
              rating: 5,
            },
            {
              quote:
                "I've owned Mykita, Lindberg, and Matsuda. EYECAP's hinge tolerance and zero-tint BlueBlock lenses are the finest optical engineering on the market today.",
              author: "Julian Chen",
              role:
                "Creative Director, Tokyo",
              rating: 5,
            },
            {
              quote:
                "The OTP delivery process was brilliant. Courier arrived, validated the code directly on the portal, and the luxury presentation case is worthy of haute horlogerie.",
              author: "Marcus Sterling",
              role:
                "Fintech Executive, London",
              rating: 5,
            },
          ].map((t, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-eyecap-card border border-eyecap-border/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-amber-400 gap-1 mb-4">
                  {[...Array(t.rating)].map(
                    (_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 fill-current"
                      />
                    )
                  )}
                </div>

                <p className="text-sm text-eyecap-silver italic leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {t.author}
                </p>

                <p className="text-xs text-eyecap-muted">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}