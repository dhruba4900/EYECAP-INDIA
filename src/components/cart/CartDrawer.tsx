"use client";

import React from "react";
import Link from "next/link";
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function CartDrawer() {
  const { items, itemCount, subtotal, isDrawerOpen, setIsDrawerOpen, removeFromCart } = useCart();

  if (!isDrawerOpen) return null;

  const freeShippingThreshold = 300;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-eyecap-surface border-l border-eyecap-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-6 border-b border-eyecap-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-eyecap-cyan" />
              <h2 className="text-base font-semibold tracking-wide text-white uppercase">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-eyecap-silver hover:text-white rounded-lg hover:bg-eyecap-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-eyecap-card/60 px-6 py-3 border-b border-eyecap-border text-xs">
            <div className="flex justify-between items-center mb-1.5 text-gray-300">
              <span>
                {subtotal >= freeShippingThreshold
                  ? "🎉 You have qualified for Complimentary Insured Express Shipping"
                  : `Add ${formatCurrency(freeShippingThreshold - subtotal)} more for Free Express Delivery`}
              </span>
            </div>
            <div className="w-full bg-eyecap-dark h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-eyecap-cyan to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-eyecap-silver py-12">
                <ShoppingBag className="w-12 h-12 text-eyecap-muted stroke-1 mb-4" />
                <p className="text-base font-medium text-white mb-1">Your bag is empty</p>
                <p className="text-xs text-eyecap-muted max-w-xs mb-6">
                  Explore our Japanese Beta-Titanium and Polarized collections to discover your next silhouette.
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-gray-200 transition-colors"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl bg-eyecap-card/40 border border-eyecap-border/60 hover:border-eyecap-border transition-colors"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-20 h-20 rounded-lg object-cover bg-eyecap-dark shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-eyecap-muted hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-eyecap-silver">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: item.colorHex || "#333" }}
                        />
                        <span>{item.variantName}</span>
                        <span className="text-eyecap-muted">• Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-sm font-mono font-medium text-eyecap-cyan">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Button */}
          {items.length > 0 && (
            <div className="p-6 border-t border-eyecap-border bg-eyecap-surface/95 space-y-4">
              <div className="space-y-1.5 text-xs text-eyecap-silver">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-white text-sm">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{subtotal >= freeShippingThreshold ? "Complimentary" : "$15.00"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-eyecap-border font-semibold text-white text-sm">
                  <span>Estimated Total</span>
                  <span className="font-mono text-eyecap-cyan text-base">
                    {formatCurrency(subtotal >= freeShippingThreshold ? subtotal : subtotal + 15)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-eyecap-cyan to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-eyecap-cyan/20 transition-all"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-eyecap-muted">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit Encrypted Handshake • OTP Verified Handover</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
