"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

type ProductResult = {
  trackingNumber: string;
  serialNumber: string;
  status: string;

  manufacturedAt: string | null;
  purchasedAt: string | null;
  deliveredAt: string | null;
  warrantyUntil: string | null;

  model: {
    name: string;
    modelNumber: string;
    headline: string | null;
    releaseDate: string | null;

    specifications: {
      frameShape: string;
      frameMaterial: string;
      lensMaterial: string;
      lensWidthMm: number;
      bridgeWidthMm: number;
      templeLengthMm: number;
      totalWeightG: number;
      genderStyle: string;
    };
  };

  variant: {
    name: string;
    colorName: string;
    size: string;
    sku: string;
  } | null;

  owner: {
    displayName: string;
  } | null;

  order: {
    orderNumber: string;
    status: string;
    purchasedAt: string | null;
    delivery: {
      trackingNumber: string;
      status: string;
      acceptedAt: string | null;
      pickedUpAt: string | null;
      outForDeliveryAt: string | null;
      deliveredAt: string | null;
    } | null;
  } | null;

  warranty: {
    status: string;
    expiresAt: string | null;
    renewable: boolean;
  };
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProductTracker() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = value.trim();

    if (!query) {
      setError("Please enter a product tracking number or serial number.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/support/product-track?value=${encodeURIComponent(query)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No EYECAP product was found with this tracking or serial number."
        );
      }

      setResult(data.product);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to find this product."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="track-product"
      className="rounded-[2rem] border border-eyecap-border bg-eyecap-card/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10"
    >
      <div className="max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-eyecap-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-eyecap-muted">
          <Search className="h-3.5 w-3.5" />
          Product Verification
        </div>

        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Track Your EYECAP Product
        </h2>

        <p className="mt-3 text-sm leading-6 text-eyecap-muted sm:text-base">
          Verify your eyewear using its unique Product Tracking Number
          or Serial Number.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 flex flex-col gap-3 sm:flex-row"
        aria-live="polite"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter product tracking number or serial number"
          aria-label="Product Tracking Number or Serial Number"
          autoComplete="off"
          spellCheck={false}
          className="min-h-14 flex-1 rounded-2xl border border-eyecap-border bg-eyecap-dark px-5 text-sm text-eyecap-light outline-none transition placeholder:text-eyecap-muted focus:border-eyecap-cyan focus:ring-2 focus:ring-eyecap-cyan/20"
        />

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-eyecap-cyan disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying product...
            </>
          ) : (
            <>
              TRACK PRODUCT
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-5">
          {/* Identity */}
          <div className="rounded-2xl border border-eyecap-border bg-eyecap-dark/60 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-eyecap-muted">
                  Verified product
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  {result.model.name}
                </h3>

                <p className="mt-1 text-sm text-eyecap-muted">
                  Model {result.model.modelNumber}
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-eyecap-cyan/20 bg-eyecap-cyan/5 px-3 py-1.5 text-xs font-semibold text-eyecap-cyan">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {result.status}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info
                label="Product Tracking Number"
                value={result.trackingNumber}
              />

              <Info
                label="Registered Serial Number"
                value={result.serialNumber}
              />

              <Info
                label="Release Date"
                value={formatDate(result.model.releaseDate)}
              />

              <Info
                label="Manufactured"
                value={formatDate(result.manufacturedAt)}
              />

              <Info
                label="Purchased"
                value={formatDate(result.purchasedAt)}
              />

              <Info
                label="Delivered"
                value={formatDate(result.deliveredAt)}
              />
            </div>
          </div>

          {/* Owner */}
          {result.owner && (
            <div className="rounded-2xl border border-eyecap-border bg-eyecap-dark/60 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-eyecap-muted">
                Registered owner
              </p>

              <p className="mt-2 text-lg font-semibold">
                {result.owner.displayName}
              </p>

              <p className="mt-1 text-xs text-eyecap-muted">
                Personal information is protected.
              </p>
            </div>
          )}

          {/* Product specifications */}
          <div className="rounded-2xl border border-eyecap-border bg-eyecap-dark/60 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-eyecap-muted">
              Product specifications
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="Frame Shape"
                value={result.model.specifications.frameShape}
              />

              <Info
                label="Frame Material"
                value={result.model.specifications.frameMaterial}
              />

              <Info
                label="Lens Material"
                value={result.model.specifications.lensMaterial}
              />

              <Info
                label="Lens Width"
                value={`${result.model.specifications.lensWidthMm} mm`}
              />

              <Info
                label="Bridge"
                value={`${result.model.specifications.bridgeWidthMm} mm`}
              />

              <Info
                label="Temple"
                value={`${result.model.specifications.templeLengthMm} mm`}
              />

              <Info
                label="Weight"
                value={`${result.model.specifications.totalWeightG} g`}
              />

              <Info
                label="Style"
                value={result.model.specifications.genderStyle}
              />
            </div>
          </div>

          {/* Order */}
          {result.order && (
            <div className="rounded-2xl border border-eyecap-border bg-eyecap-dark/60 p-5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-eyecap-cyan" />

                <p className="text-xs uppercase tracking-[0.18em] text-eyecap-muted">
                  Purchase & delivery
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info
                  label="Order Number"
                  value={result.order.orderNumber}
                />

                <Info
                  label="Order Status"
                  value={result.order.status}
                />

                {result.order.delivery && (
                  <>
                    <Info
                      label="Delivery Tracking"
                      value={result.order.delivery.trackingNumber}
                    />

                    <Info
                      label="Delivery Status"
                      value={result.order.delivery.status}
                    />

                    <Info
                      label="Last Delivery Update"
                      value={formatDate(
                        result.order.delivery.outForDeliveryAt ??
                          result.order.delivery.pickedUpAt ??
                          result.order.delivery.acceptedAt ??
                          result.order.delivery.deliveredAt
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Warranty */}
          <div className="rounded-2xl border border-eyecap-border bg-eyecap-dark/60 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-eyecap-cyan" />

              <p className="text-xs uppercase tracking-[0.18em] text-eyecap-muted">
                Warranty
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {result.warranty.status === "ACTIVE"
                    ? "Warranty Active"
                    : result.warranty.status === "EXPIRED"
                      ? "Warranty Expired"
                      : "Warranty Not Available"}
                </p>

                <p className="mt-1 text-sm text-eyecap-muted">
                  Expires: {formatDate(result.warranty.expiresAt)}
                </p>
              </div>

              {result.warranty.renewable && (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-eyecap-border px-5 text-sm font-semibold transition hover:border-eyecap-cyan hover:text-eyecap-cyan"
                  onClick={() => {
                    // Warranty renewal flow will be connected later.
                    alert("Warranty renewal will be available soon.");
                  }}
                >
                  Renew Warranty
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-eyecap-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-eyecap-light">
        {value || "Not available"}
      </p>
    </div>
  );
}