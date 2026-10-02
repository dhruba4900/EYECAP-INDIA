"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  Eye,
  Gem,
  Globe2,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-eyecap-dark text-white">
      {/* =========================================================
          HERO / FOUNDER SECTION
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-eyecap-border/50">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-eyecap-cyan/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-28">
          {/* Section label */}
          <div className="mb-10 flex items-center gap-3">
            <span className="h-px w-10 bg-eyecap-cyan" />
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-cyan">
              The Founder
            </span>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            {/* Founder Image */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-3 rounded-[2rem] border border-eyecap-cyan/10" />
              <div className="absolute -inset-6 rounded-[2.5rem] border border-eyecap-border/30" />

              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-eyecap-card shadow-2xl">
                <Image
                  src="/images/about/owner_debojyoti.jpeg"
                  alt="Founder of EYECAP"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                />

                {/* Image gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-eyecap-cyan" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/80">
                      EYECAP INDIA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Content */}
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-mono uppercase tracking-[0.3em] text-eyecap-muted">
                Founder & Visionary
              </p>

              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Debojyoti
                <span className="block text-eyecap-cyan">
                  Bhattacharjya
                </span>
              </h1>

              <div className="mt-7 h-px w-20 bg-eyecap-cyan/70" />

              <p className="mt-7 text-base leading-8 text-eyecap-silver sm:text-lg">
                At EYECAP, eyewear is more than an accessory.

                It is an extension of who you are — a signature that shapes your presence, reflects your character, and frames the way you experience the world.
              </p>

              <p className="mt-5 text-sm leading-7 text-eyecap-muted sm:text-base">
                Because the right frame does not simply change how you look.
              </p>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-eyecap-silver max-w-2xl">
                <span className="text-white font-medium italic">it changes how you are seen.</span>
                </p>

              <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-eyecap-border/60 bg-eyecap-card/40 p-4">
                  <Sparkles className="mb-3 h-5 w-5 text-eyecap-cyan" />
                  <p className="text-xs font-semibold text-white">
                    Innovation
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-eyecap-muted">
                    Design with purpose
                  </p>
                </div>

                <div className="rounded-2xl border border-eyecap-border/60 bg-eyecap-card/40 p-4">
                  <Gem className="mb-3 h-5 w-5 text-eyecap-cyan" />
                  <p className="text-xs font-semibold text-white">
                    Luxury
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-eyecap-muted">
                    Detail without compromise
                  </p>
                </div>

                <div className="rounded-2xl border border-eyecap-border/60 bg-eyecap-card/40 p-4">
                  <Eye className="mb-3 h-5 w-5 text-eyecap-cyan" />
                  <p className="text-xs font-semibold text-white">
                    Vision
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-eyecap-muted">
                    See beyond ordinary
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT EYECAP
      ========================================================== */}
      <section className="border-b border-eyecap-border/50">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-cyan">
                About EYECAP
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                More than
                <span className="block text-eyecap-silver">
                  eyewear.
                </span>
              </h2>
            </div>

            <div className="space-y-6 text-sm leading-8 text-eyecap-muted sm:text-base">
              <p>
                EYECAP is envisioned as a modern eyewear brand where
                aesthetics, precision, technology, and individuality meet.
              </p>

              <p>
                From everyday optical frames to expressive sunglasses,
                specialized eyewear, and future-facing concepts, every
                collection is designed around the idea of creating a
                distinctive visual identity.
              </p>

              <p>
                Our approach combines contemporary design language with
                attention to geometry, materials, proportions, comfort, and
                the details that make a frame feel truly personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VISION
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-eyecap-border/50">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-eyecap-cyan/[0.04] via-transparent to-blue-600/[0.04]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Globe2 className="mx-auto h-7 w-7 text-eyecap-cyan" />

            <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-muted">
              Our Vision
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              A new perspective on
              <span className="block text-eyecap-cyan">
                modern eyewear.
              </span>
            </h2>

            <p className="mt-7 text-sm leading-8 text-eyecap-muted sm:text-base">
              We believe the future of eyewear will be shaped by people who
              expect both design and functionality. EYECAP aims to create
              products that feel sophisticated today while remaining open to
              the possibilities of tomorrow.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          DESIGN / CRAFTSMANSHIP
      ========================================================== */}
      <section className="border-b border-eyecap-border/50">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-cyan">
              Design Philosophy
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Designed around
              <span className="text-eyecap-silver"> you.</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-eyecap-muted sm:text-base">
              Every frame begins with the relationship between form,
              proportion, comfort, and personality.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-eyecap-border/60 bg-eyecap-card/40 p-7">
              <Award className="h-6 w-6 text-eyecap-cyan" />

              <h3 className="mt-6 text-lg font-semibold">
                Precision
              </h3>

              <p className="mt-3 text-sm leading-7 text-eyecap-muted">
                Geometry and proportion are treated as essential elements of
                the overall character of every frame.
              </p>
            </div>

            <div className="rounded-3xl border border-eyecap-border/60 bg-eyecap-card/40 p-7">
              <Gem className="h-6 w-6 text-eyecap-cyan" />

              <h3 className="mt-6 text-lg font-semibold">
                Materials
              </h3>

              <p className="mt-3 text-sm leading-7 text-eyecap-muted">
                Material choices are considered not only for appearance, but
                also for comfort, durability, and everyday experience.
              </p>
            </div>

            <div className="rounded-3xl border border-eyecap-border/60 bg-eyecap-card/40 p-7">
              <Sparkles className="h-6 w-6 text-eyecap-cyan" />

              <h3 className="mt-6 text-lg font-semibold">
                Individuality
              </h3>

              <p className="mt-3 text-sm leading-7 text-eyecap-muted">
                Eyewear becomes meaningful when it reflects the person
                wearing it rather than simply following a trend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          EYECAP INDIA
      ========================================================== */}
      <section className="border-b border-eyecap-border/50">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="rounded-[2rem] border border-eyecap-border/60 bg-eyecap-card/30 p-8 sm:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-cyan">
                  EYECAP INDIA
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Born with an Indian
                  <span className="block text-eyecap-silver">
                    perspective.
                  </span>
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-8 text-eyecap-muted sm:text-base">
                  EYECAP aims to build an Indian eyewear identity that feels
                  contemporary, refined, and globally aware — while remaining
                  connected to the people and culture from which it grows.
                </p>
              </div>

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-eyecap-cyan/20 bg-eyecap-cyan/5">
                <span className="text-3xl font-black tracking-tight text-eyecap-cyan">
                  E
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center sm:px-8 lg:px-10 lg:py-28">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-eyecap-muted">
            Discover EYECAP
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Find your perspective.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-eyecap-muted sm:text-base">
            Explore the complete EYECAP collection and discover the frame
            that belongs to your identity.
          </p>

          <Link
            href="/products"
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black transition-all hover:bg-eyecap-cyan"
          >
            Explore All Collections
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
