"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  // Step state: 1 (Address), 2 (Delivery & Payment), 3 (Confirmed)
  const [step, setStep] = useState(1);

  // Address form
  const [address, setAddress] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : "Dhiman Roy",
    phone: user?.phone || "+1 (555) 392-8810",
    street: "742 Evergreen Terrace",
    apartment: "Penthouse 4B",
    city: "San Francisco",
    state: "CA",
    postalCode: "94105",
    country: "United States",
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("892");

  // Coupon
  const [couponCode, setCouponCode] = useState(searchParams.get("coupon") || "EYECAP10");
  const [discount, setDiscount] = useState(0);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Calculate discount if coupon exists
  useEffect(() => {
    async function checkCoupon() {
      if (!couponCode) return;
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponCode, subtotal }),
        });
        if (res.ok) {
          const data = await res.json();
          setDiscount(data.discountAmount);
        }
      } catch (e) {
        // ignore
      }
    }
    if (subtotal > 0) checkCoupon();
  }, [couponCode, subtotal]);

  const shippingFee = subtotal > 300 ? 0.0 : 15.0;
  const tax = Number(((subtotal - discount) * 0.08).toFixed(2));
  const finalTotal = Math.max(0, subtotal - discount + tax + shippingFee);

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please log in to complete your purchase.");
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        shippingAddress: address,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        paymentMethod,
        couponCode: discount > 0 ? couponCode : undefined,
        notes: "Direct courier handover requested.",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order.");
        setSubmitting(false);
        return;
      }

      setConfirmedOrder(data);
      setStep(3);
      clearCart();
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // STEP 3: ORDER CONFIRMED SCREEN
  if (step === 3 && confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 min-h-screen">
        <div className="p-8 sm:p-12 rounded-3xl bg-eyecap-surface border border-eyecap-border shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-950/60 border-2 border-emerald-500/50 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Transaction Authenticated & Confirmed
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Thank You for Your Order
            </h1>
            <p className="text-sm text-eyecap-silver font-mono">
              Order Reference: <span className="text-white font-bold">{confirmedOrder.orderNumber}</span>
            </p>
          </div>

          {/* CRITICAL DELIVERY OTP DISPLAY CARD */}
          <div className="p-6 rounded-2xl bg-eyecap-dark border-2 border-eyecap-cyan/60 relative overflow-hidden shadow-2xl shadow-eyecap-cyan/10 max-w-lg mx-auto">
            <div className="absolute top-0 right-0 px-3 py-1 bg-eyecap-cyan text-black font-mono font-bold text-[10px] uppercase tracking-wider rounded-bl-lg">
              Courier Handover Protocol
            </div>

            <p className="text-xs text-eyecap-silver uppercase font-mono tracking-wider mb-2">
              Your Secure Delivery OTP
            </p>

            <div className="flex items-center justify-center gap-3 my-3">
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-[0.25em] text-white">
                {confirmedOrder.deliveryOtp}
              </span>
              <button
                onClick={() => copyToClipboard(confirmedOrder.deliveryOtp)}
                className="p-2 rounded-lg bg-eyecap-card border border-eyecap-border hover:text-white transition-colors"
                title="Copy OTP"
              >
                {copiedOtp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-eyecap-silver" />}
              </button>
            </div>

            <p className="text-xs text-eyecap-muted max-w-md mx-auto leading-relaxed">
              When your assigned courier arrives with your package, provide them with this 6-digit OTP. The order cannot be marked DELIVERED until verified server-side.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/orders/${confirmedOrder.orderNumber}`}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-eyecap-cyan to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-eyecap-cyan/20 flex items-center justify-center gap-2"
            >
              <span>Track Live Delivery Progress</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/account/orders"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-eyecap-card border border-eyecap-border text-white font-semibold text-xs uppercase tracking-wider hover:bg-eyecap-surface transition-colors"
            >
              View in Account Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Steps Indicator */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 ${step >= 1 ? "text-eyecap-cyan font-bold" : "text-eyecap-muted"}`}
          >
            <span className="w-6 h-6 rounded-full border flex items-center justify-center">1</span>
            <span>Delivery Destination</span>
          </button>
          <div className="h-px w-16 bg-eyecap-border" />
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-2 ${step >= 2 ? "text-eyecap-cyan font-bold" : "text-eyecap-muted"}`}
          >
            <span className="w-6 h-6 rounded-full border flex items-center justify-center">2</span>
            <span>Payment & Handover</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Steps Form Area */}
        <div className="lg:col-span-8 space-y-8">
          {step === 1 && (
            <div className="p-8 rounded-2xl bg-eyecap-surface border border-eyecap-border space-y-6">
              <div className="flex items-center gap-3 border-b border-eyecap-border/60 pb-4">
                <Truck className="w-5 h-5 text-eyecap-cyan" />
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                  1. Delivery Destination Address
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-eyecap-silver block mb-1">Full Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">Recipient Phone (For Delivery OTP SMS)</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-eyecap-silver block mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">Apartment / Suite / Floor</label>
                  <input
                    type="text"
                    value={address.apartment}
                    onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>

                <div>
                  <label className="text-eyecap-silver block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-eyecap-dark border border-eyecap-border text-white focus:outline-none focus:border-eyecap-cyan"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Payment Methods */}
              <div className="p-8 rounded-2xl bg-eyecap-surface border border-eyecap-border space-y-6">
                <div className="flex items-center gap-3 border-b border-eyecap-border/60 pb-4">
                  <CreditCard className="w-5 h-5 text-eyecap-cyan" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                    2. Select Payment & Verification Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("ONLINE")}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      paymentMethod === "ONLINE"
                        ? "border-eyecap-cyan bg-eyecap-cyan/10 ring-2 ring-eyecap-cyan/30"
                        : "border-eyecap-border bg-eyecap-card/40 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === "ONLINE" ? "text-eyecap-cyan" : "text-eyecap-silver"}`} />
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        INSTANT VERIFIED
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">Online Card / Apple Pay</h4>
                    <p className="text-xs text-eyecap-silver mt-1">256-Bit TLS Simulated Stripe Gateway</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      paymentMethod === "COD"
                        ? "border-eyecap-cyan bg-eyecap-cyan/10 ring-2 ring-eyecap-cyan/30"
                        : "border-eyecap-border bg-eyecap-card/40 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Banknote className={`w-5 h-5 ${paymentMethod === "COD" ? "text-eyecap-cyan" : "text-eyecap-silver"}`} />
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-eyecap-card text-eyecap-muted border border-eyecap-border">
                        UPON HANDOVER
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-eyecap-silver mt-1">Pay courier in cash after verifying OTP</p>
                  </button>
                </div>

                {/* Simulated Card Input if ONLINE */}
                {paymentMethod === "ONLINE" && (
                  <div className="p-4 rounded-xl bg-eyecap-dark border border-eyecap-border/60 space-y-3">
                    <div className="flex items-center justify-between text-xs text-eyecap-silver pb-2 border-b border-eyecap-border/50">
                      <span>Simulated Secure Card Entry</span>
                      <span className="text-[10px] font-mono text-emerald-400">Sandbox Test Mode Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="col-span-2">
                        <label className="text-eyecap-muted block mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-eyecap-surface border border-eyecap-border font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="text-eyecap-muted block mb-1">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-eyecap-surface border border-eyecap-border font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="text-eyecap-muted block mb-1">CVC Security Code</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-eyecap-surface border border-eyecap-border font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-eyecap-silver hover:text-white"
                  >
                    ← Back to Address
                  </button>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-eyecap-cyan to-blue-600 text-black font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-xl shadow-eyecap-cyan/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{submitting ? "Reserving Inventory & Placing..." : `Confirm & Authorize ${formatCurrency(finalTotal)}`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Right Sidebar */}
        <div className="lg:col-span-4 bg-eyecap-surface p-6 rounded-2xl border border-eyecap-border/70 space-y-5 sticky top-28">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            Order Review
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.id} className="flex gap-3 items-center">
                <img src={it.imageUrl} alt={it.productName} className="w-12 h-12 rounded-lg object-cover bg-eyecap-dark" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{it.productName}</p>
                  <p className="text-[11px] text-eyecap-muted">{it.variantName} × {it.quantity}</p>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {formatCurrency(it.unitPrice * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-eyecap-silver pt-4 border-t border-eyecap-border/60">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400 font-mono">
                <span>VIP Discount ({couponCode})</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Sales Tax (8%)</span>
              <span className="font-mono text-white">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Insured Courier Handover</span>
              <span>{shippingFee === 0 ? "Complimentary ($0.00)" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-eyecap-border font-bold text-white text-base">
              <span>Total Balance</span>
              <span className="font-mono text-eyecap-cyan">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-eyecap-dark border border-eyecap-border text-[11px] text-eyecap-muted space-y-1">
            <div className="flex items-center gap-1.5 text-white font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Loss Handover Protocol</span>
            </div>
            <p>A 6-digit OTP will be generated upon confirmation for courier verification.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
