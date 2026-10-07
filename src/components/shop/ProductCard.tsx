"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, Star, ShoppingBag, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<Product["variants"] extends infer T ? T extends Array<infer V> ? V | null : null : null>(
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : null
  );

  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const primaryImage =
    product.images[0]?.url ||
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80";

  const hoverImage = product.images[1]?.url || primaryImage;

  const handleQuickAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    setLoading(true);

    try {
      const res = await addToCart(
        product.id,
        selectedVariant?.id,
        1
      );

      if (res.success) {
        setAdded(true);

        window.setTimeout(() => {
          setAdded(false);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLowStock =
    product.inventory &&
    product.inventory.available <= product.inventory.lowStockThreshold;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-eyecap-border/60 bg-eyecap-card/50 transition-all duration-300 hover:border-eyecap-border hover:shadow-2xl hover:shadow-eyecap-cyan/5">

      {/* ------------------------------------------------------------------ */}
      {/* Product Image                                                      */}
      {/* ------------------------------------------------------------------ */}

      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-eyecap-dark/80"
      >
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">

          {product.isNew && (
            <span className="rounded-full bg-eyecap-cyan px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-black">
              NEW RELEASE
            </span>
          )}

          {product.isFeatured && !product.isNew && (
            <span className="rounded-full border border-eyecap-gold/30 bg-eyecap-gold/20 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-eyecap-gold">
              FLAGSHIP
            </span>
          )}

          {isLowStock && (
            <span className="rounded-full border border-rose-800/40 bg-rose-950/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-rose-300">
              ONLY {product.inventory?.available} LEFT
            </span>
          )}
        </div>

        {/* 3D Badge */}
        {product.model3d && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-eyecap-border bg-eyecap-surface/80 px-2 py-1 text-[10px] font-mono text-eyecap-cyan backdrop-blur-md">
            <Eye className="h-3 w-3" />
            <span>3D VIEW</span>
          </div>
        )}

        {/* Primary Image */}
        <img
          src={primaryImage}
          alt={product.images[0]?.alt || product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Hover Image */}
        {hoverImage !== primaryImage && (
          <img
            src={hoverImage}
            alt={product.images[1]?.alt || product.name}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Product Details                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-1 flex-col justify-between p-5">

        <div>

          {/* Metadata */}
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono uppercase text-eyecap-muted">
            <span>{product.frameShape}</span>

            <span className="max-w-[140px] truncate">
              {product.frameMaterial}
            </span>
          </div>

          {/* Product Name */}
          <Link
            href={`/products/${product.slug}`}
            className="block"
          >
            <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-eyecap-cyan">
              {product.name}
            </h3>
          </Link>

          {/* Headline */}
          {product.headline && (
            <p className="mt-1 line-clamp-1 text-xs text-eyecap-muted">
              {product.headline}
            </p>
          )}

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-eyecap-silver">
            <div className="flex items-center text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>

            <span className="text-xs font-semibold text-white">
              {product.rating.toFixed(1)}
            </span>

            <span className="text-[11px] text-eyecap-muted">
              ({product.reviewCount})
            </span>
          </div>

          {/* Color Swatches */}
          {product.variants && product.variants.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5">

              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  title={variant.colorName}
                  aria-label={`Select ${variant.colorName}`}
                  className={`h-3.5 w-3.5 rounded-full border transition-all ${
                    selectedVariant?.id === variant.id
                      ? "scale-110 ring-2 ring-eyecap-cyan ring-offset-2 ring-offset-eyecap-surface"
                      : "border-white/20 hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: variant.colorHex,
                  }}
                />
              ))}

              <span className="ml-1 text-[10px] text-eyecap-muted">
                {selectedVariant?.colorName}
              </span>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Pricing + Quick Add                                               */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-5 flex items-center justify-between border-t border-eyecap-border/50 pt-3">

          <div className="flex flex-col">

            <div className="flex items-baseline gap-2">

              <span className="text-lg font-bold font-mono text-white">
                {formatCurrency(product.basePrice)}
              </span>

              {product.comparePrice !== null &&
                product.comparePrice !== undefined &&
                product.comparePrice > product.basePrice && (
                  <span className="text-xs font-mono text-eyecap-muted line-through">
                    {formatCurrency(product.comparePrice)}
                  </span>
                )}
            </div>

            <span className="text-[10px] font-mono text-emerald-400">
              In Stock & Verified
            </span>
          </div>

          {/* Quick Add */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={loading}
            className={`flex items-center justify-center rounded-xl border p-2.5 transition-all ${
              added
                ? "border-emerald-400 bg-emerald-500 text-black"
                : "border-eyecap-border bg-eyecap-surface text-white hover:border-white hover:bg-white hover:text-black"
            } ${
              loading
                ? "cursor-wait opacity-60"
                : ""
            }`}
            title={
              loading
                ? "Adding to bag..."
                : added
                  ? "Added to bag"
                  : "Quick add to bag"
            }
            aria-label={
              loading
                ? "Adding to bag"
                : added
                  ? "Added to bag"
                  : "Quick add to bag"
            }
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}