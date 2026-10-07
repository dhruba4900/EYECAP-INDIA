"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Star,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  ExternalLink,
} from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { formatCurrency } from "@/lib/utils";

type HeroMediaType = "image" | "video";

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  body: string;

  ctaText: string;
  ctaUrl: string;

  secondaryText?: string;
  secondaryUrl?: string;

  mediaType?: HeroMediaType;
  imageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  mobileVideoUrl?: string;
  posterUrl?: string;
  mobilePosterUrl?: string;

  mediaAlt?: string;
  mediaHref?: string;

  duration?: number;
  transition?: "fade" | "slide" | "zoom";

  isActive?: boolean;
  displayOrder?: number;

  backgroundColor?: string;
  overlayOpacity?: number;

  specs?: {
    value: string;
    label: string;
    accent?: boolean;
  }[];
};

type HomepageSection = {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
  background?: string;
  displayOrder?: number;
  isEnabled?: boolean;

  heroSlides?: unknown;
};

type HomepagePost = {
  id: string;
  type?: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
};

type HomepageContent = {
  sections?: HomepageSection[];
  posts?: HomepagePost[];
  heroSlides?: unknown;
  graphics?: unknown;
};

type Product = {
  id: string;
  [key: string]: unknown;
};

const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: "different-vision",
    eyebrow: "Series 2026 • Japanese Beta-Titanium",
    title: "SEE THE WORLD",
    highlight: "DIFFERENTLY.",
    body:
      "Engineered for vision. Designed for you. Handcrafted in Sabae from aerospace-grade beta-titanium and fitted with high-definition optical lenses.",
    ctaText: "Shop Collection",
    ctaUrl: "/products",
    secondaryText: "Explore Titanium",
    secondaryUrl: "/products?category=titanium-luxury",
    mediaType: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1800&q=85",
    mediaAlt: "EYECAP premium titanium eyewear",
    mediaHref: "/products?category=titanium-luxury",
    duration: 6500,
    transition: "fade",
    overlayOpacity: 0.55,
    specs: [
      {
        value: "14.8g",
        label: "Ultralight Frame",
      },
      {
        value: "100%",
        label: "UV400 Protection",
        accent: true,
      },
      {
        value: "0-Screw",
        label: "Flex Cylinders",
      },
    ],
  },

  {
    id: "precision-engineered",
    eyebrow: "Optical Engineering • Zero Compromise",
    title: "ENGINEERED FOR",
    highlight: "PRECISION.",
    body:
      "Ultra-light construction, precision-balanced geometry and high-definition optics engineered for long days without sacrificing presence.",
    ctaText: "Discover Engineering",
    ctaUrl: "/products?category=titanium-luxury",
    secondaryText: "View Frames",
    secondaryUrl: "/products",
    mediaType: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1800&q=85",
    mediaAlt: "Precision engineered EYECAP eyewear",
    mediaHref: "/products?category=titanium-luxury",
    duration: 6500,
    transition: "slide",
    overlayOpacity: 0.58,
    specs: [
      {
        value: "Grade 5",
        label: "Beta-Titanium",
      },
      {
        value: "250+",
        label: "Craft Steps",
        accent: true,
      },
      {
        value: "DLC",
        label: "Premium Finish",
      },
    ],
  },

  {
    id: "cybertech-intelligence",
    eyebrow: "CyberTech • Next-Generation Eyewear",
    title: "VISION MEETS",
    highlight: "INTELLIGENCE.",
    body:
      "A future-facing eyewear platform combining sculpted design, digital-first optics and smart audio concepts for the modern creator.",
    ctaText: "Explore CyberTech",
    ctaUrl: "/products?category=cybertech-smart-audio",
    secondaryText: "Explore Collection",
    secondaryUrl: "/products",
    mediaType: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1800&q=85",
    mediaAlt: "EYECAP CyberTech smart eyewear",
    mediaHref: "/products?category=cybertech-smart-audio",
    duration: 7000,
    transition: "zoom",
    overlayOpacity: 0.52,
    specs: [
      {
        value: "5.4",
        label: "Bluetooth",
        accent: true,
      },
      {
        value: "360°",
        label: "Spatial Audio",
      },
      {
        value: "AI",
        label: "Ready Platform",
      },
    ],
  },

  {
    id: "sabae-crafted",
    eyebrow: "Sabae, Fukui • Japanese Craftsmanship",
    title: "FORGED WITH",
    highlight: "PURPOSE.",
    body:
      "From precision machining to hand finishing, every EYECAP frame is engineered around durability, comfort and timeless optical design.",
    ctaText: "Discover Craft",
    ctaUrl: "/products",
    secondaryText: "Our Craftsmanship",
    secondaryUrl: "#craftsmanship",
    mediaType: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1800&q=85",
    mediaAlt: "EYECAP Japanese craftsmanship",
    mediaHref: "#craftsmanship",
    duration: 6500,
    transition: "fade",
    overlayOpacity: 0.62,
    specs: [
      {
        value: "Japan",
        label: "Sabae Crafted",
      },
      {
        value: "Grade 5",
        label: "Titanium",
        accent: true,
      },
      {
        value: "100+",
        label: "Years of Craft",
      },
    ],
  },
];

const STATIC_CATEGORIES = [
  {
    title: "Titanium Luxury",
    slug: "titanium-luxury",
    tag: "Aerospace Beta-Titanium",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=85",
    desc: "Carved from Japanese beta-titanium monoblocks with zero solder welds.",
  },
  {
    title: "Sun & Polarized",
    slug: "sun-polarized",
    tag: "Optical Shield",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85",
    desc: "Complete UV400 filtration with premium anti-reflective and protective coatings.",
  },
  {
    title: "BlueBlock Digital",
    slug: "blueblock-digital",
    tag: "Engineered for Screens",
    image:
      "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1000&q=85",
    desc: "High-transmission lenses engineered for long coding, design and screen sessions.",
  },
  {
    title: "CyberTech Smart Audio",
    slug: "cybertech-smart-audio",
    tag: "Directional Acoustics",
    image:
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=85",
    desc: "Open-ear directional sound concepts hidden within sculpted luxury temples.",
  },
];

const DEFAULT_SPECS = [
  {
    value: "14.8g",
    label: "Ultralight Frame",
  },
  {
    value: "100%",
    label: "UV400 Protection",
    accent: true,
  },
  {
    value: "0-Screw",
    label: "Flex Cylinders",
  },
];

function isExternalUrl(url?: string) {
  if (!url) return false;

  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  );
}

function safeNumber(value: unknown, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function normalizeHeroSlides(input: unknown): HeroSlide[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((raw, index): HeroSlide | null => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const item = raw as Record<string, unknown>;

      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title
          : "SEE THE WORLD";

      const highlight =
        typeof item.highlight === "string" && item.highlight.trim()
          ? item.highlight
          : undefined;

      const eyebrow =
        typeof item.eyebrow === "string"
          ? item.eyebrow
          : typeof item.subtitle === "string"
            ? item.subtitle
            : "";

      const body =
        typeof item.body === "string"
          ? item.body
          : typeof item.description === "string"
            ? item.description
            : "";

      const ctaText =
        typeof item.ctaText === "string" && item.ctaText.trim()
          ? item.ctaText
          : "SHOP NOW";

      const ctaUrl =
        typeof item.ctaUrl === "string" && item.ctaUrl.trim()
          ? item.ctaUrl
          : typeof item.productUrl === "string" && item.productUrl.trim()
            ? item.productUrl
            : "/products";

      const mediaType: HeroMediaType =
        item.mediaType === "video" || typeof item.videoUrl === "string"
          ? "video"
          : "image";

      const specs = Array.isArray(item.specs)
        ? item.specs
            .filter(
              (spec): spec is Record<string, unknown> =>
                Boolean(spec) && typeof spec === "object",
            )
            .slice(0, 3)
            .map((spec) => ({
              value:
                typeof spec.value === "string" ? spec.value : "",
              label:
                typeof spec.label === "string" ? spec.label : "",
              accent: Boolean(spec.accent),
            }))
            .filter((spec) => spec.value || spec.label)
        : undefined;

      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `hero-${index + 1}`,

        eyebrow,
        title,
        highlight,
        body,

        ctaText,
        ctaUrl,

        secondaryText:
          typeof item.secondaryText === "string"
            ? item.secondaryText
            : undefined,

        secondaryUrl:
          typeof item.secondaryUrl === "string"
            ? item.secondaryUrl
            : undefined,

        mediaType,

        imageUrl:
          typeof item.imageUrl === "string"
            ? item.imageUrl
            : undefined,

        mobileImageUrl:
          typeof item.mobileImageUrl === "string"
            ? item.mobileImageUrl
            : undefined,

        videoUrl:
          typeof item.videoUrl === "string"
            ? item.videoUrl
            : undefined,

        mobileVideoUrl:
          typeof item.mobileVideoUrl === "string"
            ? item.mobileVideoUrl
            : undefined,

        posterUrl:
          typeof item.posterUrl === "string"
            ? item.posterUrl
            : undefined,

        mobilePosterUrl:
          typeof item.mobilePosterUrl === "string"
            ? item.mobilePosterUrl
            : undefined,

        mediaAlt:
          typeof item.mediaAlt === "string"
            ? item.mediaAlt
            : title,

        mediaHref:
          typeof item.mediaHref === "string"
            ? item.mediaHref
            : ctaUrl,

        duration: Math.max(
          2500,
          safeNumber(item.duration, 6500),
        ),

        transition:
          item.transition === "slide" ||
          item.transition === "zoom"
            ? item.transition
            : "fade",

        isActive:
          typeof item.isActive === "boolean"
            ? item.isActive
            : true,

        displayOrder: safeNumber(
          item.displayOrder,
          index,
        ),

        backgroundColor:
          typeof item.backgroundColor === "string"
            ? item.backgroundColor
            : undefined,

        overlayOpacity: Math.min(
          0.9,
          Math.max(
            0,
            safeNumber(item.overlayOpacity, 0.55),
          ),
        ),

        specs:
          specs && specs.length > 0
            ? specs
            : undefined,
      };
    })
    .filter((slide): slide is HeroSlide => slide !== null)
    .filter((slide) => slide.isActive !== false)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) -
        (b.displayOrder ?? 0),
    );
}

function HeroMedia({
  slide,
  priority = false,
}: {
  slide: HeroSlide;
  priority?: boolean;
}) {
  const imageSource =
    slide.mobileImageUrl || slide.imageUrl;

  const desktopImage =
    slide.imageUrl || slide.mobileImageUrl;

  const mobileVideo =
    slide.mobileVideoUrl || slide.videoUrl;

  const desktopVideo =
    slide.videoUrl || slide.mobileVideoUrl;

  const mediaAlt =
    slide.mediaAlt ||
    slide.title ||
    "EYECAP eyewear";

  const commonImageClass =
    "absolute inset-0 h-full w-full object-cover";

  if (slide.mediaType === "video" && desktopVideo) {
    return (
      <picture className="absolute inset-0 block h-full w-full">
        <video
          key={`${slide.id}-desktop-video`}
          className={`${commonImageClass} hidden md:block`}
          src={desktopVideo}
          poster={
            slide.posterUrl ||
            slide.mobilePosterUrl
          }
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-label={mediaAlt}
        />

        <video
          key={`${slide.id}-mobile-video`}
          className={`${commonImageClass} block md:hidden`}
          src={mobileVideo}
          poster={
            slide.mobilePosterUrl ||
            slide.posterUrl
          }
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-label={mediaAlt}
        />
      </picture>
    );
  }

  if (desktopImage || imageSource) {
    return (
      <picture className="absolute inset-0 block h-full w-full">
        {slide.mobileImageUrl && (
          <source
            media="(max-width: 767px)"
            srcSet={slide.mobileImageUrl}
          />
        )}

        <img
          src={desktopImage || imageSource}
          alt={mediaAlt}
          className={commonImageClass}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
        />
      </picture>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-eyecap-surface via-eyecap-dark to-black" />
  );
}

function HeroMediaLink({
  slide,
  priority,
}: {
  slide: HeroSlide;
  priority?: boolean;
}) {
  const href = slide.mediaHref || slide.ctaUrl;

  const media = (
    <div className="absolute inset-0">
      <HeroMedia
        slide={slide}
        priority={priority}
      />

      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: slide.overlayOpacity ?? 0.55,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />

      <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/80 backdrop-blur-md">
        <span>Explore</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );

  if (!href) {
    return media;
  }

  if (isExternalUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Explore ${slide.title}`}
        className="absolute inset-0 z-[1]"
      >
        {media}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`Explore ${slide.title}`}
      className="absolute inset-0 z-[1]"
    >
      {media}
    </Link>
  );
}

function HeroCTA({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  const className = secondary
    ? "inline-flex items-center gap-2 rounded-full border border-eyecap-border bg-eyecap-card/80 px-7 py-4 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-eyecap-surface"
    : "group inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-xs font-semibold uppercase tracking-widest text-black shadow-xl shadow-white/10 transition-all hover:bg-gray-200";

  if (isExternalUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
        {secondary ? (
          <ExternalLink className="h-3.5 w-3.5" />
        ) : (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        )}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
      {secondary ? (
        <ChevronRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      )}
    </Link>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] =
    useState<Product[]>([]);

  const [homepageContent, setHomepageContent] =
    useState<HomepageContent | null>(null);

  const [loading, setLoading] = useState(true);

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
        const [productsResponse, contentResponse] =
          await Promise.all([
            fetch(
              "/api/products?limit=8&featured=true",
              {
                method: "GET",
                cache: "no-store",
              },
            ),
            fetch("/api/content/homepage", {
              method: "GET",
              cache: "no-store",
            }),
          ]);

        if (!mounted) {
          return;
        }

        if (productsResponse.ok) {
          const data =
            await productsResponse.json();

          setFeaturedProducts(
            Array.isArray(data.products)
              ? data.products
              : [],
          );
        }

        if (contentResponse.ok) {
          const data =
            await contentResponse.json();

          setHomepageContent(
            data && typeof data === "object"
              ? data
              : null,
          );
        }
      } catch (error) {
        console.error(
          "EYECAP homepage data loading failed:",
          error,
        );
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

  const getSection = useCallback(
    (key: string): HomepageSection | undefined =>
      homepageContent?.sections?.find(
        (section) => section.key === key,
      ),
    [homepageContent],
  );

  const isSectionEnabled = useCallback(
    (key: string) =>
      getSection(key)?.isEnabled !== false,
    [getSection],
  );

  const heroSlides = useMemo(() => {
    const contentSlides = normalizeHeroSlides(
      homepageContent?.heroSlides ??
        getSection("hero")?.heroSlides,
    );

    return contentSlides.length > 0
      ? contentSlides
      : FALLBACK_HERO_SLIDES;
  }, [homepageContent, getSection]);

  useEffect(() => {
    if (activeHeroSlide >= heroSlides.length) {
      setActiveHeroSlide(0);
    }
  }, [activeHeroSlide, heroSlides.length]);

  useEffect(() => {
    const hero = document.getElementById(
      "eyecap-hero",
    );

    if (!hero || typeof IntersectionObserver === "undefined") {
      setIsHeroVisible(true);
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setIsHeroVisible(entry.isIntersecting);
        },
        {
          threshold: 0.15,
        },
      );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const activeSlide =
    heroSlides[activeHeroSlide] ??
    heroSlides[0];

  const goToHeroSlide = useCallback(
    (index: number) => {
      if (heroSlides.length <= 0) {
        return;
      }

      const nextIndex =
        (index + heroSlides.length) %
        heroSlides.length;

      setActiveHeroSlide(nextIndex);
    },
    [heroSlides.length],
  );

  const nextHeroSlide = useCallback(() => {
    goToHeroSlide(activeHeroSlide + 1);
  }, [activeHeroSlide, goToHeroSlide]);

  const previousHeroSlide = useCallback(() => {
    goToHeroSlide(activeHeroSlide - 1);
  }, [activeHeroSlide, goToHeroSlide]);

  useEffect(() => {
    if (
      isHeroPaused ||
      !isHeroVisible ||
      heroSlides.length <= 1 ||
      !activeSlide
    ) {
      return;
    }

    const duration =
      activeSlide.duration ?? 6500;

    const timer = window.setTimeout(() => {
      setActiveHeroSlide(
        (current) =>
          (current + 1) % heroSlides.length,
      );
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeSlide,
    activeHeroSlide,
    heroSlides.length,
    isHeroPaused,
    isHeroVisible,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        previousHeroSlide();
      }

      if (event.key === "ArrowRight") {
        nextHeroSlide();
      }

      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        setIsHeroPaused((paused) => !paused);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [nextHeroSlide, previousHeroSlide]);

  const heroTransitionClass =
    activeSlide?.transition === "slide"
      ? "animate-in fade-in slide-in-from-right-6 duration-700"
      : activeSlide?.transition === "zoom"
        ? "animate-in fade-in zoom-in-95 duration-700"
        : "animate-in fade-in duration-700";

  const heroSection = getSection("hero");

  const heroBackground =
    activeSlide?.backgroundColor ||
    heroSection?.background ||
    undefined;

  const heroSpecs =
    activeSlide?.specs?.length
      ? activeSlide.specs
      : DEFAULT_SPECS;

  return (
    <div className="flex min-h-screen flex-col bg-eyecap-dark">
      {/* =========================================================
          1. CINEMATIC HERO
          ========================================================= */}
      {isSectionEnabled("hero") && activeSlide && (
        <section
          id="eyecap-hero"
          style={{
            order: heroSection?.displayOrder ?? 0,
            backgroundColor: heroBackground,
          }}
          className="relative min-h-[90vh] overflow-hidden border-b border-eyecap-border/50 bg-gradient-radial from-eyecap-surface/40 via-eyecap-dark to-black"
          aria-roledescription="carousel"
          aria-label="EYECAP featured collection"
        >
          <div
            key={`hero-background-${activeSlide.id}`}
            className={`absolute inset-0 ${heroTransitionClass}`}
          >
            <HeroMediaLink
              slide={activeSlide}
              priority={activeHeroSlide === 0}
            />
          </div>

          {/* Ambient premium lighting */}
          <div className="pointer-events-none absolute left-1/2 top-1/4 h-[350px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-r from-eyecap-cyan/15 via-blue-600/10 to-transparent blur-[140px]" />

          <div className="pointer-events-none absolute bottom-10 right-10 h-[250px] w-[400px] rounded-full bg-eyecap-gold/10 blur-[120px]" />

          <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
              {/* Hero Copy */}
              <div
                key={`hero-copy-${activeSlide.id}`}
                className={`lg:col-span-6 ${heroTransitionClass}`}
              >
                <div className="flex flex-col items-start space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs uppercase tracking-wider text-eyecap-cyan backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" />

                    <span>
                      {activeHeroSlide === 0 &&
                      heroSection?.subtitle
                        ? heroSection.subtitle
                        : activeSlide.eyebrow}
                    </span>
                  </div>

                  <h1 className="max-w-3xl text-4xl font-bold leading-[1.03] tracking-tight text-white drop-shadow-2xl sm:text-6xl lg:text-7xl">
                    {activeHeroSlide === 0 &&
                    heroSection?.title ? (
                      heroSection.title
                    ) : (
                      <>
                        {activeSlide.title}

                        {activeSlide.highlight && (
                          <>
                            <br />
                            <span className="text-gradient-cyan">
                              {activeSlide.highlight}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </h1>

                  <p className="max-w-xl text-base font-light leading-relaxed text-eyecap-silver sm:text-lg">
                    {activeHeroSlide === 0 &&
                    heroSection?.body
                      ? heroSection.body
                      : activeSlide.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <HeroCTA
                      href={activeSlide.ctaUrl}
                    >
                      {activeSlide.ctaText}
                    </HeroCTA>

                    {activeSlide.secondaryText &&
                      activeSlide.secondaryUrl && (
                        <HeroCTA
                          href={
                            activeSlide.secondaryUrl
                          }
                          secondary
                        >
                          {activeSlide.secondaryText}
                        </HeroCTA>
                      )}
                  </div>

                  {/* Dynamic slide specifications */}
                  <div className="grid w-full max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:gap-6">
                    {heroSpecs.map(
                      (spec, index) => (
                        <div key={`${spec.label}-${index}`}>
                          <p
                            className={`font-mono text-xl font-bold sm:text-2xl ${
                              spec.accent
                                ? "text-eyecap-cyan"
                                : "text-white"
                            }`}
                          >
                            {spec.value}
                          </p>

                          <p className="mt-1 text-[9px] uppercase tracking-wider text-eyecap-muted sm:text-[10px]">
                            {spec.label}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Hero Media/Product Presentation */}
              <div
                key={`hero-media-${activeSlide.id}`}
                className={`lg:col-span-6 ${heroTransitionClass}`}
              >
                <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-2xl shadow-black/40 backdrop-blur-sm">
                  <HeroMediaLink
                    slide={activeSlide}
                    priority={activeHeroSlide === 0}
                  />

                  {/* Product media frame */}
                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/10" />

                  <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-white/70 backdrop-blur-md">
                    EYECAP / {String(
                      activeHeroSlide + 1,
                    ).padStart(2, "0")}
                  </div>

                  <div className="pointer-events-none absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-white/70 backdrop-blur-md">
                    {activeSlide.mediaType ===
                    "video"
                      ? "Cinematic Motion"
                      : "Precision Optics"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Controls */}
          <div
            className="absolute bottom-6 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 items-center justify-between gap-4 sm:bottom-8 sm:px-6 lg:px-8"
            role="group"
            aria-label="Hero slider controls"
          >
            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
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
                      : "w-5 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}

              <span className="ml-2 hidden text-[10px] font-mono text-eyecap-muted sm:inline">
                {String(
                  activeHeroSlide + 1,
                ).padStart(2, "0")}{" "}
                /{" "}
                {String(heroSlides.length).padStart(
                  2,
                  "0",
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setIsHeroPaused(
                    (paused) => !paused,
                  )
                }
                aria-label={
                  isHeroPaused
                    ? "Resume hero slider"
                    : "Pause hero slider"
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-eyecap-silver backdrop-blur-md transition-colors hover:border-eyecap-cyan hover:text-white"
              >
                {isHeroPaused ? (
                  <Play className="h-3.5 w-3.5" />
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={previousHeroSlide}
                aria-label="Previous hero slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-eyecap-silver backdrop-blur-md transition-colors hover:border-eyecap-cyan hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={nextHeroSlide}
                aria-label="Next hero slide"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 text-eyecap-silver backdrop-blur-md transition-colors hover:border-eyecap-cyan hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          2. CORE INNOVATION CATEGORIES
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
          className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="mb-14 flex flex-col justify-between md:flex-row md:items-end">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
                Architectural Divisions
              </span>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {getSection("categories")
                  ?.title ||
                  "Curated Optical Collections"}
              </h2>

              {getSection("categories")
                ?.subtitle && (
                <p className="mt-2 max-w-xl text-sm text-eyecap-silver">
                  {
                    getSection(
                      "categories",
                    )?.subtitle
                  }
                </p>
              )}
            </div>

            <Link
              href={
                getSection("categories")
                  ?.ctaUrl || "/products"
              }
              className="mt-4 flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-eyecap-silver transition-colors hover:text-white md:mt-0"
            >
              <span>
                {getSection("categories")
                  ?.ctaText ||
                  "View All Frames"}
              </span>

              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STATIC_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group relative flex h-96 flex-col justify-end overflow-hidden rounded-2xl border border-eyecap-border/70 bg-eyecap-card p-6 transition-all duration-300 hover:border-eyecap-border hover:shadow-2xl"
              >
                <img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover brightness-75 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-eyecap-dark via-eyecap-dark/60 to-transparent" />

                <div className="relative z-10">
                  <span className="mb-2 inline-block rounded border border-eyecap-border bg-eyecap-dark/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan">
                    {category.tag}
                  </span>

                  <h3 className="mb-1.5 text-xl font-bold text-white transition-colors group-hover:text-eyecap-cyan">
                    {category.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-eyecap-silver">
                    {category.desc}
                  </p>

                  <div className="flex items-center gap-1 text-xs font-semibold text-white transition-transform group-hover:translate-x-1">
                    <span>
                      Explore Frames
                    </span>

                    <ArrowRight className="h-3.5 w-3.5 text-eyecap-cyan" />
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
          className="mx-auto w-full max-w-7xl border-t border-eyecap-border/60 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mb-12 flex flex-col justify-between sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
                High-Precision Lineup
              </span>

              <h2 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
                {getSection("featured")
                  ?.title ||
                  "Featured Eyewear"}
              </h2>

              {getSection("featured")
                ?.subtitle && (
                <p className="mt-2 text-sm text-eyecap-silver">
                  {
                    getSection(
                      "featured",
                    )?.subtitle
                  }
                </p>
              )}
            </div>

            <Link
              href="/products"
              className="mt-4 text-xs font-mono uppercase tracking-widest text-eyecap-cyan hover:underline sm:mt-0"
            >
              {getSection("featured")
                ?.ctaText ||
                "Explore Complete Catalog"}{" "}
              →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-2xl border border-eyecap-border/50 bg-eyecap-card"
                />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-eyecap-border bg-eyecap-card px-6 py-12 text-center">
              <p className="text-sm text-eyecap-silver">
                Featured eyewear will appear here
                soon.
              </p>

              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-eyecap-cyan hover:underline"
              >
                Browse Collection
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* =========================================================
          4. LATEST POSTS
          ========================================================= */}
      {isSectionEnabled("latest") &&
        homepageContent?.posts &&
        homepageContent.posts.length > 0 && (
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
                      "What's New"}
                  </h2>

                  {getSection("latest")
                    ?.subtitle && (
                    <p className="mt-2 text-sm text-eyecap-silver">
                      {
                        getSection(
                          "latest",
                        )?.subtitle
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {homepageContent.posts.map(
                  (post) => (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-2xl border border-eyecap-border bg-eyecap-card"
                    >
                      {post.coverImage && (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          loading="lazy"
                          decoding="async"
                          className="h-56 w-full object-cover"
                        />
                      )}

                      <div className="space-y-3 p-5">
                        {post.type && (
                          <p className="text-[10px] font-mono uppercase tracking-widest text-eyecap-cyan">
                            {post.type}
                          </p>
                        )}

                        <h3 className="text-xl font-semibold text-white">
                          {post.title}
                        </h3>

                        {post.subtitle && (
                          <p className="text-sm text-eyecap-silver">
                            {post.subtitle}
                          </p>
                        )}

                        {post.description && (
                          <p className="line-clamp-3 text-sm leading-relaxed text-eyecap-silver">
                            {post.description}
                          </p>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

      {/* =========================================================
          5. CRAFTSMANSHIP
          ========================================================= */}
      {isSectionEnabled(
        "craftsmanship",
      ) && (
        <section
          id="craftsmanship"
          style={{
            order:
              getSection("craftsmanship")
                ?.displayOrder ?? 4,
            backgroundColor:
              getSection("craftsmanship")
                ?.background || undefined,
          }}
          className="relative overflow-hidden border-y border-eyecap-border bg-eyecap-surface/40 py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-5">
                <span className="text-xs font-mono uppercase tracking-widest text-eyecap-gold">
                  {getSection(
                    "craftsmanship",
                  )?.subtitle ||
                    "Japanese Beta-Titanium"}
                </span>

                <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {getSection(
                    "craftsmanship",
                  )?.title || (
                    <>
                      Forged at 1,668°C.
                      <br />
                      Finished by Master
                      Artisans.
                    </>
                  )}
                </h2>

                <p className="text-sm font-light leading-relaxed text-eyecap-silver">
                  {getSection(
                    "craftsmanship",
                  )?.body ||
                    "In Fukui Prefecture, Japan, optical metallurgists have refined the craft of titanium cold-forging for over 100 years. EYECAP frames undergo hundreds of individual manufacturing steps, from precision machining to hand finishing."}
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    "Hypoallergenic & biocompatible Grade 5 beta-titanium",
                    "Precision-engineered flex-cylinder hinge mechanism",
                    "Diamond-like Carbon premium surface treatment",
                    "Medical-grade silicone nose pad system",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-xs text-gray-200"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-eyecap-cyan" />

                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:col-span-7">
                <img
                  src="https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1000&q=85"
                  alt="EYECAP craftsmanship"
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full rounded-2xl border border-eyecap-border object-cover sm:h-80"
                />

                <img
                  src="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1000&q=85"
                  alt="EYECAP optical design"
                  loading="lazy"
                  decoding="async"
                  className="mt-8 h-64 w-full rounded-2xl border border-eyecap-border object-cover sm:h-80"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          6. TESTIMONIALS
          ========================================================= */}
      <section
        style={{ order: 5 }}
        className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
            Testimonials
          </span>

          <h2 className="mt-1 text-3xl font-bold text-white">
            Worn by Discerning Visionaries
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              quote:
                "The Chronos Alpha is ridiculously light. I forget I am wearing glasses during long coding sessions, and the titanium finish has stayed immaculate.",
              author: "Elena Rostova",
              role: "Principal AI Architect, San Francisco",
              rating: 5,
            },
            {
              quote:
                "I've owned several premium eyewear brands. EYECAP's hinge tolerance and lens engineering feel exceptionally refined.",
              author: "Julian Chen",
              role: "Creative Director, Tokyo",
              rating: 5,
            },
            {
              quote:
                "The delivery experience was brilliant. The luxury presentation and attention to detail made the entire purchase feel premium.",
              author: "Marcus Sterling",
              role: "Fintech Executive, London",
              rating: 5,
            },
          ].map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col justify-between rounded-2xl border border-eyecap-border/60 bg-eyecap-card p-8"
            >
              <div>
                <div className="mb-4 flex gap-1 text-amber-400">
                  {Array.from({
                    length: testimonial.rating,
                  }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-current"
                    />
                  ))}
                </div>

                <p className="mb-6 text-sm italic leading-relaxed text-eyecap-silver">
                  "{testimonial.quote}"
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {testimonial.author}
                </p>

                <p className="text-xs text-eyecap-muted">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}