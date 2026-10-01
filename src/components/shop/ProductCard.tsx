"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Eye, Star, ShoppingBag, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    headline?: string | null;
    basePrice: number;
    comparePrice?: number | null;
    frameShape: string;
    frameMaterial: string;
    rating: number;
    reviewCount: number;
    isFeatured?: boolean;
    isNew?: boolean;
    images: { url: string; alt?: string | null }[];
    variants?: { id: string; name: string; colorHex: string; colorName: string }[];
    model3d?: any;
    inventory?: { available: number; lowStockThreshold: number } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const primaryImage = product.images[0]?.url || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80";
  const hoverImage = product.images[1]?.url || primaryImage;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await addToCart(product.id, selectedVariant?.id, 1);
    setLoading(false);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const isLowStock = product.inventory && product.inventory.available <= product.inventory.lowStockThreshold;

  return (
    <div className="group relative rounded-2xl bg-eyecap-card/50 border border-eyecap-border/60 hover:border-eyecap-border transition-all duration-300 hover:shadow-2xl hover:shadow-eyecap-cyan/5 flex flex-col justify-between overflow-hidden">
      {/* Product Image Frame */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] bg-eyecap-dark/80 overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.isNew && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-eyecap-cyan text-black font-bold">
              NEW RELEASE
            </span>
          )}
          {product.isFeatured && !product.isNew && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-eyecap-gold/20 text-eyecap-gold border border-eyecap-gold/30 font-semibold">
              FLAGSHIP
            </span>
          )}
          {isLowStock && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/40">
              ONLY {product.inventory?.available} LEFT
            </span>
          )}
        </div>

        {/* 3D Available Badge */}
        {product.model3d && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 text-[10px] font-mono text-eyecap-cyan bg-eyecap-surface/80 backdrop-blur-md border border-eyecap-border px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            <span>3D VIEW</span>
          </div>
        )}

        {/* Image with smooth crossfade hover */}
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </Link>

      {/* Product Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata & Material */}
          <div className="flex items-center justify-between text-[11px] font-mono text-eyecap-muted uppercase mb-1.5">
            <span>{product.frameShape}</span>
            <span className="truncate max-w-[140px]">{product.frameMaterial}</span>
          </div>

          {/* Product Name */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-base font-semibold text-white group-hover:text-eyecap-cyan transition-colors truncate">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-eyecap-silver">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-semibold text-white text-xs">{product.rating.toFixed(1)}</span>
            <span className="text-eyecap-muted text-[11px]">({product.reviewCount})</span>
          </div>

          {/* Color Swatches */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  title={v.colorName}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedVariant?.id === v.id
                      ? "ring-2 ring-eyecap-cyan ring-offset-2 ring-offset-eyecap-surface scale-110"
                      : "border-white/20 hover:scale-105"
                  }`}
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
              <span className="text-[10px] text-eyecap-muted ml-1">
                {selectedVariant?.colorName}
              </span>
            </div>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="mt-5 pt-3 border-t border-eyecap-border/50 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-white">
                {formatCurrency(product.basePrice)}
              </span>
              {product.comparePrice && (
                <span className="text-xs line-through text-eyecap-muted font-mono">
                  {formatCurrency(product.comparePrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">In Stock & Verified</span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleQuickAdd}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              added
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-eyecap-surface border-eyecap-border text-white hover:bg-white hover:text-black hover:border-white"
            }`}
            title="Quick add to bag"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
