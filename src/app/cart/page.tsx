"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, removeFromCart, addToCart } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon");
      } else {
        setCouponDiscount(data.discountAmount);
        setCouponApplied(data.code);
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const shippingFee = subtotal > 300 ? 0.0 : 15.0;
  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-eyecap-surface border border-eyecap-border flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-eyecap-muted" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Shopping Bag is Empty</h2>
        <p className="text-sm text-eyecap-silver max-w-sm mb-8 leading-relaxed">
          Discover hand-finished Japanese Beta-Titanium silhouettes and UV400 polarized optical shields.
        </p>
        <Link
          href="/products"
          className="px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="border-b border-eyecap-border/60 pb-6 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
          Review Order
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
          Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)} Items)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-eyecap-card/40 border border-eyecap-border flex flex-col sm:flex-row items-center gap-6"
            >
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="w-24 h-24 rounded-xl object-cover bg-eyecap-dark shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                <Link href={`/products/${item.slug || ""}`} className="hover:text-eyecap-cyan transition-colors">
                  <h3 className="text-base font-semibold text-white">{item.productName}</h3>
                </Link>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-eyecap-silver">
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: item.colorHex || "#333" }}
                  />
                  <span>Variant: {item.variantName}</span>
                </div>
                <p className="text-xs font-mono text-emerald-400">Available: {item.availableStock} in stock</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center bg-eyecap-surface border border-eyecap-border rounded-xl px-2 py-1">
                <button
                  onClick={() => addToCart(item.productId, item.variantId, -1)}
                  disabled={item.quantity <= 1}
                  className="p-1.5 text-eyecap-silver hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-mono font-bold text-white text-xs">
                  {item.quantity}
                </span>
                <button
                  onClick={() => addToCart(item.productId, item.variantId, 1)}
                  disabled={item.quantity >= item.availableStock}
                  className="p-1.5 text-eyecap-silver hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Price & Delete */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                <span className="text-base font-mono font-bold text-white">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-eyecap-muted hover:text-rose-400 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="lg:col-span-4 space-y-6 sticky top-28">
          <div className="p-6 rounded-2xl bg-eyecap-surface border border-eyecap-border/70 space-y-5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Order Breakdown
            </h3>

            {/* Coupon Application Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-eyecap-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Coupon (e.g. EYECAP10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-eyecap-dark border border-eyecap-border text-xs text-white uppercase font-mono focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCode}
                  className="px-4 py-2 rounded-xl bg-eyecap-card border border-eyecap-border text-xs font-semibold text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {validatingCoupon ? "..." : "Apply"}
                </button>
              </div>

              {couponApplied && (
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" /> Coupon {couponApplied} applied: -{formatCurrency(couponDiscount)}
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-400 font-mono">{couponError}</p>
              )}
            </form>

            {/* Price Lines */}
            <div className="space-y-2.5 text-xs text-eyecap-silver pt-3 border-t border-eyecap-border/60">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-mono">
                  <span>VIP Discount</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Courier Handover</span>
                <span>{shippingFee === 0 ? "Complimentary ($0.00)" : formatCurrency(shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-eyecap-border font-bold text-white text-base">
                <span>Total Amount</span>
                <span className="font-mono text-eyecap-cyan">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => router.push(`/checkout${couponApplied ? `?coupon=${couponApplied}` : ""}`)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-eyecap-cyan to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-eyecap-cyan/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-eyecap-muted text-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct Courier Handover With 6-Digit OTP Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
