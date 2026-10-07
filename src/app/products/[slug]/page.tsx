"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Eye,
  Camera,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Share2,
} from "lucide-react";
import EyewearViewer from "@/components/3d/ProductEyewearViewer";
import ProductCard from "@/components/shop/ProductCard";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import type { GraphicsConfig } from "@/lib/graphics";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [graphics, setGraphics] = useState<GraphicsConfig | undefined>();
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 3D interactive vs 2D Photo Gallery
  const [viewMode, setViewMode] = useState<"3d" | "photo">("3d");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Selected Variant & Quantity
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setRelated(data.related || []);
          if (data.product?.variants?.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          }
        }
      } catch (e) {
        console.error("Product load error", e);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProduct();
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetch("/api/graphics")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load the 3D viewer configuration");
        const data = await response.json();
        if (active) setGraphics(data.config);
      })
      .catch((error) => console.error("Graphics configuration load error:", error));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-[500px] rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border/50" />
          <div className="space-y-6">
            <div className="h-8 w-2/3 bg-eyecap-card animate-pulse rounded-lg" />
            <div className="h-6 w-1/3 bg-eyecap-card animate-pulse rounded-lg" />
            <div className="h-32 w-full bg-eyecap-card animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Eyewear Model Not Found</h2>
        <p className="text-sm text-eyecap-muted mb-6">The requested product could not be located in our active catalog.</p>
        <Link
          href="/products"
          className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const availableStock = product.inventory?.available || 0;
  const isLowStock = availableStock > 0 && availableStock <= (product.inventory?.lowStockThreshold || 10);
  const isOutOfStock = availableStock <= 0;

  const currentPrice = product.basePrice + (selectedVariant?.priceAdjustment || 0);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    const res = await addToCart(product.id, selectedVariant?.id, quantity);
    setAdding(false);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, selectedVariant?.id, quantity);
    router.push("/checkout");
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewTitle("");
        setReviewComment("");
        // Reload product details to update review list
        const refreshed = await (await fetch(`/api/products/${slug}`)).json();
        if (refreshed.product) setProduct(refreshed.product);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Breadcrumbs */}
      <nav className="text-xs font-mono text-eyecap-muted flex items-center gap-2 mb-8">
        <Link href="/" className="hover:text-white transition-colors">EYECAP</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white transition-colors">CATALOG</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category?.slug}`} className="hover:text-white transition-colors uppercase">
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-white font-semibold">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: 3D WebGL Viewer & Photo Gallery Tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between bg-eyecap-surface/80 p-1.5 rounded-xl border border-eyecap-border/60">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  viewMode === "3d"
                    ? "bg-eyecap-cyan text-black font-bold shadow-md shadow-eyecap-cyan/20"
                    : "text-eyecap-silver hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Interactive 3D View</span>
              </button>
              <button
                onClick={() => setViewMode("photo")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  viewMode === "photo"
                    ? "bg-eyecap-cyan text-black font-bold shadow-md shadow-eyecap-cyan/20"
                    : "text-eyecap-silver hover:text-white"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Hi-Res Gallery ({product.images?.length || 1})</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-eyecap-muted hidden sm:inline px-3">
              {viewMode === "3d" ? "WebGL Hardware Accelerated" : "Studio Photography"}
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="relative min-h-[460px] sm:min-h-[520px] rounded-2xl overflow-hidden bg-eyecap-dark border border-eyecap-border/80">
            {viewMode === "3d" ? (
              <EyewearViewer
                modelType={product.model3d?.modelType || "geometric"}
                frameColor={selectedVariant?.colorHex || product.model3d?.frameColor || "#383B42"}
                lensColor={product.model3d?.lensColor || "#0F172A"}
                metalness={product.model3d?.metalness || 0.9}
                roughness={product.model3d?.roughness || 0.18}
                transmission={product.model3d?.transmission || 0.65}
                graphics={graphics}
                modelUrl={product.model3d?.modelUrl}
                posterUrl={product.images[0]?.url}
                className="w-full h-[520px]"
              />
            ) : (
              <div className="relative w-full h-[520px]">
                <img
                  src={product.images[activeImageIndex]?.url || product.images[0]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  onClick={() => {
                    setViewMode("photo");
                    setActiveImageIndex(idx);
                  }}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    viewMode === "photo" && activeImageIndex === idx
                      ? "border-eyecap-cyan ring-2 ring-eyecap-cyan/30 scale-105"
                      : "border-eyecap-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Purchasing Controls & Specifications */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            {/* Category & Headline */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan bg-eyecap-surface px-2.5 py-1 rounded-md border border-eyecap-border">
                {product.category?.name}
              </span>
              <span className="text-xs font-mono text-eyecap-muted">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {product.name}
            </h1>

            {product.headline && (
              <p className="text-sm font-medium text-eyecap-silver italic mb-4">
                "{product.headline}"
              </p>
            )}

            {/* Rating Stars */}
            <div className="flex items-center gap-2 text-sm text-eyecap-silver mb-6">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.rating) ? "fill-current" : "opacity-30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-white">{product.rating.toFixed(1)}</span>
              <span className="text-eyecap-muted">• {product.reviewCount} Verified Customer Reviews</span>
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-xl bg-eyecap-surface/80 border border-eyecap-border/60 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-eyecap-muted block">
                  Bespoke Retail Value
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold font-mono text-white">
                    {formatCurrency(currentPrice)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-sm line-through font-mono text-eyecap-muted">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="text-right">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Low Stock: {availableStock} Remaining
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock & Ready to Dispatch
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Color Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs uppercase font-mono tracking-wider text-eyecap-silver">
                  Material Finish / Colorway:
                </span>
                <span className="text-xs font-bold text-white font-mono">
                  {selectedVariant?.colorName}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-eyecap-cyan bg-eyecap-surface ring-2 ring-eyecap-cyan/30 text-white font-semibold"
                        : "border-eyecap-border bg-eyecap-card/40 text-gray-400 hover:text-white hover:border-gray-500"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span className="text-xs">{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Purchase Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-4 items-center">
              {/* Quantity */}
              <div className="flex items-center bg-eyecap-surface border border-eyecap-border rounded-xl px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 text-eyecap-silver hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-white text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={quantity >= availableStock}
                  className="p-2 text-eyecap-silver hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Bag */}
              <button
                onClick={handleAddToCart}
                disabled={adding || isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                  added
                    ? "bg-emerald-500 text-black shadow-emerald-500/20"
                    : isOutOfStock
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-white text-black hover:bg-gray-200 shadow-white/10"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{added ? "Added to Bag ✓" : isOutOfStock ? "Out of Stock" : "Add to Bag"}</span>
              </button>
            </div>

            {/* Instant Buy Now */}
            {!isOutOfStock && (
              <button
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-eyecap-cyan to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-eyecap-cyan/20 transition-all"
              >
                <span>Express Buy Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Delivery & Security Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-eyecap-border/60 text-center">
            <div className="p-3 rounded-xl bg-eyecap-surface/40 border border-eyecap-border/40">
              <Truck className="w-4 h-4 text-eyecap-cyan mx-auto mb-1.5" />
              <p className="text-[10px] font-mono uppercase text-gray-300">OTP Handover</p>
            </div>
            <div className="p-3 rounded-xl bg-eyecap-surface/40 border border-eyecap-border/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-[10px] font-mono uppercase text-gray-300">2-Year Warranty</p>
            </div>
            <div className="p-3 rounded-xl bg-eyecap-surface/40 border border-eyecap-border/40">
              <RotateCcw className="w-4 h-4 text-eyecap-gold mx-auto mb-1.5" />
              <p className="text-[10px] font-mono uppercase text-gray-300">30-Day Returns</p>
            </div>
          </div>

          {/* Technical Specifications Table */}
          <div className="rounded-2xl bg-eyecap-surface/60 border border-eyecap-border/70 p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Haute Optique Technical Blueprint
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Frame Metallurgy</span>
                <span className="text-white font-medium">{product.frameMaterial}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Optical Lenses</span>
                <span className="text-white font-medium">{product.lensMaterial}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Lens Width</span>
                <span className="font-mono text-white">{product.lensWidthMm} mm</span>
              </div>
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Bridge Span</span>
                <span className="font-mono text-white">{product.bridgeWidthMm} mm</span>
              </div>
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Temple Length</span>
                <span className="font-mono text-white">{product.templeLengthMm} mm</span>
              </div>
              <div className="flex flex-col">
                <span className="text-eyecap-muted text-[11px]">Total Frame Weight</span>
                <span className="font-mono text-eyecap-cyan font-bold">{product.totalWeightG} grams</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description Narrative */}
      <section className="mt-20 pt-12 border-t border-eyecap-border/60">
        <div className="max-w-3xl">
          <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan block mb-2">
            The Design Narrative
          </span>
          <h2 className="text-2xl font-bold text-white mb-4">Architectural Vision & Execution</h2>
          <p className="text-sm text-eyecap-silver leading-relaxed whitespace-pre-line font-light">
            {product.description}
          </p>
        </div>
      </section>

      {/* Customer Reviews & Submit Form */}
      <section className="mt-20 pt-12 border-t border-eyecap-border/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
              Client Appraisals
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">Verified Owner Reviews</h2>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="text-2xl font-bold font-mono text-white">{product.rating.toFixed(1)}</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-xs text-eyecap-muted">({product.reviewCount} total)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-eyecap-card border border-eyecap-border/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {rev.user?.firstName} {rev.user?.lastName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                          VERIFIED PURCHASE
                        </span>
                      )}
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{rev.title}</h4>
                  <p className="text-xs text-eyecap-silver leading-relaxed font-light">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-eyecap-muted italic">Be the first to submit a review for this eyewear silhouette.</p>
            )}
          </div>

          {/* Add Review Form */}
          <div className="lg:col-span-5 bg-eyecap-surface p-6 rounded-2xl border border-eyecap-border">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Write a Review
            </h3>
            {reviewSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
                Thank you! Your verified review has been published.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-eyecap-silver block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setReviewRating(num)}
                        className={`p-2 rounded-lg border text-sm transition-colors ${
                          reviewRating >= num
                            ? "text-amber-400 border-amber-400/50 bg-amber-400/10"
                            : "text-gray-600 border-eyecap-border"
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exceptional lightness and fit"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">Comment</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Share your experience with frame weight, optical clarity, or fit..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-lg bg-white text-black font-semibold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-24 pt-12 border-t border-eyecap-border/60">
          <h2 className="text-xl font-bold text-white mb-6">Complementary Silhouettes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((rel: any) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
