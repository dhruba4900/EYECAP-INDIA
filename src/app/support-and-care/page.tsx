import ProductTracker from "@/components/support/ProductTracker";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import OrderTrackingLink from "./OrderTrackingLink";

export const metadata: Metadata = {
  title: "Support & Care | EYECAP",
  description:
    "Access your EYECAP orders and learn about product, delivery and after-sales support.",
};

const SUPPORT_PHONE = "+15550192834";

const serviceSteps = [
  {
    number: "01",
    title: "Open your account",
    description:
      "Open your account to access your EYECAP order information.",
    icon: PackageSearch,
  },
  {
    number: "02",
    title: "Review",
    description:
      "Review available order and delivery details in one place.",
    icon: MessageCircle,
  },
  {
    number: "03",
    title: "Get support",
    description:
      "Online ticket creation and status updates are not connected yet.",
    icon: ShieldCheck,
  },
  {
    number: "04",
    title: "Follow up",
    description:
      "Ticket history and resolution tracking will be available when the support system is connected.",
    icon: CheckCircle2,
  },
];

export default function SupportAndCarePage() {
  return (
    <div className="min-h-screen bg-eyecap-dark text-white">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative overflow-hidden border-b border-eyecap-border/50">
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-eyecap-cyan/10 blur-3xl" />
          <div className="absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-eyecap-border bg-eyecap-surface/70 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-eyecap-cyan backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              EYECAP Support & Care
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl">
              Care that stays with
              <span className="block bg-gradient-to-r from-eyecap-cyan via-white to-blue-400 bg-clip-text text-transparent">
                your eyewear.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-eyecap-muted sm:text-base sm:leading-8">
              Find your existing order information and learn about the product
              and delivery support tools available through your EYECAP account.
            </p>
          </div>

          {/* =====================================================
              TRACKING CARDS
          ====================================================== */}
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-eyecap-border bg-eyecap-surface/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-eyecap-cyan/10 text-eyecap-cyan">
                  <PackageSearch className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold sm:text-base">
                    Track Your EYECAP Product
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-eyecap-muted sm:text-sm">
                    Verify your eyewear using its unique Product Tracking Number
                    or Serial Number.
                  </p>
                </div>
              </div>

              <ProductTracker />
            </div>

            <div className="rounded-3xl border border-eyecap-border bg-eyecap-surface/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-eyecap-cyan/10 text-eyecap-cyan">
                  <Truck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold sm:text-base">
                    Track Your Order
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-eyecap-muted sm:text-sm">
                    View your orders, delivery progress and shipment tracking
                    information from your EYECAP account.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <OrderTrackingLink />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SUPPORT OPTIONS
      ========================================================== */}
      <section className="border-b border-eyecap-border/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-eyecap-cyan">
              NEED SUPPORT?
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Need help with your product, order, delivery, warranty, payment, or account?
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/support-and-care/report"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-eyecap-cyan"
            >
              REPORT AN ISSUE
            </Link>

            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-eyecap-border px-6 py-3.5 text-sm font-semibold text-white transition hover:border-eyecap-cyan hover:text-eyecap-cyan"
            >
              CALL SUPPORT
            </a>

            <Link
              href="/account"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-eyecap-border px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white"
            >
              VIEW MY ORDERS
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          SERVICE JOURNEY
      ========================================================== */}
      <section className="border-b border-eyecap-border/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-eyecap-cyan">
                THE EYECAP SERVICE JOURNEY
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Every issue has
                <span className="block text-eyecap-muted">
                  a traceable journey.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-eyecap-muted">
                Order details are available through your account. Online
                support tickets, evidence uploads and ticket history are not
                connected yet.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {serviceSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className="rounded-3xl border border-eyecap-border/60 bg-eyecap-surface/60 p-5 transition hover:border-eyecap-border"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-eyecap-cyan">
                        {step.number}
                      </span>

                      <Icon className="h-4 w-4 text-eyecap-muted" />
                    </div>

                    <h3 className="mt-7 text-sm font-semibold">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-eyecap-muted">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}