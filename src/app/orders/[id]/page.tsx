"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  PackageCheck,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedOtp, setCopiedOtp] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadOrder();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 min-h-screen">
        <div className="h-64 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-xs text-eyecap-muted mb-6">Unable to locate order reference #{id}.</p>
        <Link href="/account" className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase">
          Return to My Account
        </Link>
      </div>
    );
  }

  // The 8 status stages in timeline
  const stages = [
    { key: "ORDER_PLACED", label: "Order Placed" },
    { key: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
    { key: "PROCESSING", label: "Laboratory Processing" },
    { key: "PACKED", label: "Inspected & Packed" },
    { key: "READY_FOR_PICKUP", label: "Ready for Courier" },
    { key: "PICKED_UP", label: "Picked Up by Courier" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered & Verified" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === order.status);
  const isDelivered = order.status === "DELIVERED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-eyecap-border pb-6">
        <div>
          <Link
            href="/account"
            className="text-xs text-eyecap-muted hover:text-white flex items-center gap-1.5 mb-2 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Account Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-eyecap-silver mt-1">
            Placed on {formatDate(order.createdAt)} • Payment Method: {order.paymentMethod} ({order.paymentStatus})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono uppercase px-3 py-1.5 rounded-full font-bold border ${
              isDelivered
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                : "bg-eyecap-surface text-eyecap-cyan border-eyecap-cyan/40 animate-pulse"
            }`}
          >
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* SECURE DELIVERY OTP CARD (Prominent if out for delivery or pending) */}
      {!isDelivered && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-eyecap-surface to-eyecap-card border-2 border-eyecap-cyan/50 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-eyecap-cyan font-bold bg-eyecap-cyan/10 px-2 py-0.5 rounded border border-eyecap-cyan/20">
                Secure Handover Verification
              </span>
              <h3 className="text-lg font-bold text-white">Courier Delivery OTP</h3>
              <p className="text-xs text-eyecap-silver max-w-md">
                Present this 6-digit OTP to courier Alex Vance upon delivery. The courier enters this into their delivery device to confirm package receipt.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-eyecap-dark px-6 py-4 rounded-xl border border-eyecap-border shadow-inner">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.2em] text-eyecap-cyan">
                {order.deliveryOtp}
              </span>
              <button
                onClick={() => copyToClipboard(order.deliveryOtp)}
                className="p-2 rounded-lg bg-eyecap-card border border-eyecap-border text-eyecap-silver hover:text-white"
                title="Copy OTP"
              >
                {copiedOtp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING TIMELINE */}
      <div className="p-8 rounded-2xl bg-eyecap-surface border border-eyecap-border space-y-6">
        <h3 className="text-xs font-mono uppercase tracking-wider text-eyecap-silver flex items-center gap-2">
          <Truck className="w-4 h-4 text-eyecap-cyan" />
          <span>Real-Time Handover Timeline</span>
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-eyecap-border">
          {stages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;

            return (
              <div key={stage.key} className="relative flex items-center gap-4">
                {/* Node icon */}
                <div
                  className={`absolute -left-[30px] sm:-left-[38px] w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-eyecap-cyan border-eyecap-cyan text-black"
                      : "bg-eyecap-dark border-eyecap-border text-eyecap-muted"
                  } ${isCurrent ? "ring-4 ring-eyecap-cyan/30 animate-pulse" : ""}`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />}
                </div>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between">
                  <span className={`text-xs font-mono uppercase ${isCurrent ? "text-eyecap-cyan font-bold" : isCompleted ? "text-white" : "text-eyecap-muted"}`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 w-fit mt-1 sm:mt-0">
                      CURRENT STATUS
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DELIVERY TRACKING ID */}
      <div className="rounded-2xl border border-eyecap-border bg-eyecap-surface p-6">
        <h3 className="text-xs font-mono uppercase tracking-wider text-eyecap-cyan">
          Delivery Tracking ID
        </h3>
        {order.delivery?.trackingNumber ? (
          <p className="mt-3 break-all font-mono text-sm font-semibold text-white">
            {order.delivery.trackingNumber}
          </p>
        ) : (
          <p className="mt-3 text-sm text-eyecap-muted">
            The tracking ID will appear here once a courier tracking number is
            assigned to this order.
          </p>
        )}
      </div>

      {/* ASSIGNED COURIER & DESTINATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courier Info */}
        <div className="p-6 rounded-2xl bg-eyecap-card/40 border border-eyecap-border space-y-3">
          <span className="text-[10px] font-mono uppercase text-eyecap-cyan">Assigned Courier Partner</span>
          {order.delivery?.partner ? (
            <div className="flex items-start gap-4 pt-1">
              <div className="w-12 h-12 rounded-xl bg-eyecap-surface border border-eyecap-border flex items-center justify-center font-bold text-white text-lg">
                {order.delivery.partner.user?.firstName[0]}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  {order.delivery.partner.user?.firstName} {order.delivery.partner.user?.lastName}
                </p>
                <p className="text-xs text-eyecap-silver">
                  Zero EV Motorcycle • Plate EYE-2026-X
                </p>
                <a
                  href={`tel:${order.delivery.partner.user?.phone || "+15550192834"}`}
                  className="inline-flex items-center gap-1.5 text-xs text-eyecap-cyan hover:underline font-mono pt-1"
                >
                  <Phone className="w-3 h-3" /> Call Courier Direct
                </a>
              </div>
            </div>
          ) : (
            <div className="text-xs text-eyecap-muted pt-1">
              Courier dispatching from central metropolitan fulfillment center shortly.
            </div>
          )}
        </div>

        {/* Shipping Destination */}
        <div className="p-6 rounded-2xl bg-eyecap-card/40 border border-eyecap-border space-y-2 text-xs">
          <span className="text-[10px] font-mono uppercase text-eyecap-cyan">Destination Address</span>
          {order.shippingAddress ? (
            <div className="space-y-1 text-eyecap-silver pt-1">
              <p className="font-semibold text-white">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street} {order.shippingAddress.apartment}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p className="font-mono text-[11px] text-eyecap-muted">Tel: {order.shippingAddress.phone}</p>
            </div>
          ) : (
            <p className="text-eyecap-muted">Standard Delivery Address</p>
          )}
        </div>
      </div>

      {/* ORDER ITEMS RECEIPT */}
      <div className="p-6 rounded-2xl bg-eyecap-surface border border-eyecap-border space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-white">
          Item Manifest ({order.items?.length || 0})
        </h3>
        <div className="divide-y divide-eyecap-border/60">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-white">{item.productName}</p>
                <p className="text-[11px] text-eyecap-muted">
                  Variant: {item.variantName} • Qty: {item.quantity}
                </p>
              </div>
              <span className="font-mono text-white">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-eyecap-border/60 flex justify-between items-center font-bold text-sm text-white">
          <span>Total Settled</span>
          <span className="font-mono text-eyecap-cyan text-base">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
