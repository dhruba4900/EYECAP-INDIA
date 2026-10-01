"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Key,
  Clock,
  Package,
  Navigation,
  Check,
  X,
  RefreshCw,
  Star,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DeliveryPartnerPage() {
  const [partner, setPartner] = useState<any>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // OTP Verification Modal
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery/assignments");
      if (res.ok) {
        const json = await res.json();
        setPartner(json.partner);
        setActiveDeliveries(json.active || []);
        setCompletedDeliveries(json.completed || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleUpdateStatus = async (deliveryId: string, status: string) => {
    try {
      const res = await fetch(`/api/delivery/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadAssignments();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openOtpModal = (delivery: any) => {
    setSelectedDelivery(delivery);
    setEnteredOtp("");
    setRecipientName(
      delivery.order?.shippingAddress?.fullName ||
      `${delivery.order?.user?.firstName} ${delivery.order?.user?.lastName}`
    );
    setOtpError(null);
    setOtpModalOpen(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !enteredOtp) return;
    setVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch(`/api/delivery/${selectedDelivery.id}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: enteredOtp,
          recipientName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Invalid OTP code");
        setVerifying(false);
        return;
      }

      setSuccessMessage("Handover verified server-side! Order successfully delivered.");
      setOtpModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadAssignments();
    } catch (err: any) {
      setOtpError(err.message || "Network error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Courier Profile & Fleet Bar */}
      {partner && (
        <div className="p-5 rounded-2xl bg-[#0F141E] border border-[#1A2332] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Courier Alex Vance</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                ACTIVE ON ROUTE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Vehicle: {partner.vehicleType} • Plate: {partner.vehiclePlate}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-gray-400 block text-[10px] uppercase">Rating</span>
              <span className="text-amber-400 font-bold flex items-center gap-1 justify-end">
                <Star className="w-3.5 h-3.5 fill-current" /> {partner.rating}
              </span>
            </div>
            <div className="h-8 w-px bg-[#1A2332]" />
            <div className="text-right">
              <span className="text-gray-400 block text-[10px] uppercase">Completed</span>
              <span className="text-white font-bold">{partner.totalDeliveries} Drops</span>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1A2332] gap-6 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "active"
              ? "border-emerald-400 text-emerald-400 font-bold"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Active Route ({activeDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "history"
              ? "border-emerald-400 text-emerald-400 font-bold"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed ({completedDeliveries.length})</span>
        </button>

        <button
          onClick={loadAssignments}
          className="ml-auto text-gray-400 hover:text-white pb-3 flex items-center gap-1 text-[11px]"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* ACTIVE DELIVERIES PIPELINE */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-[#0F141E] animate-pulse border border-[#1A2332]" />
              ))}
            </div>
          ) : activeDeliveries.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#0F141E]/40 border border-[#1A2332] p-6 space-y-2">
              <Truck className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-white font-semibold text-sm">No Active Deliveries</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                All assigned orders have been verified and completed. When admin dispatches a new order, it will appear here immediately.
              </p>
            </div>
          ) : (
            activeDeliveries.map((del) => {
              const ord = del.order;
              const addr = ord.shippingAddress;
              const customerPhone = addr?.phone || ord.user?.phone || "+15553928810";
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${addr?.street || ""} ${addr?.city || ""} ${addr?.postalCode || ""}`
              )}`;

              return (
                <div
                  key={del.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0F141E] border border-[#1A2332] space-y-5 shadow-xl"
                >
                  {/* Order Head */}
                  <div className="flex items-center justify-between border-b border-[#1A2332] pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-white">
                        Order #{ord.orderNumber}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {ord.items?.length || 1} Silhouettes • Amount: {formatCurrency(ord.total)} ({ord.paymentMethod})
                      </p>
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      {del.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Customer & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Recipient</span>
                      <p className="font-bold text-white text-sm mt-0.5">
                        {addr?.fullName || `${ord.user?.firstName} ${ord.user?.lastName}`}
                      </p>
                      <p className="text-gray-400 text-[11px]">{ord.user?.email}</p>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Drop Address</span>
                      <p className="text-gray-300 font-medium mt-0.5">
                        {addr?.street} {addr?.apartment}
                      </p>
                      <p className="text-gray-400 text-[11px]">{addr?.city}, {addr?.state} {addr?.postalCode}</p>
                    </div>
                  </div>

                  {/* Operational Quick Actions (Phone & Map) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <a
                      href={`tel:${customerPhone}`}
                      className="py-3 px-4 rounded-xl bg-[#141A26] border border-[#1A2332] hover:border-gray-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call Customer</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#141A26] border border-[#1A2332] hover:border-gray-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-eyecap-cyan" />
                      <span>GPS Navigate</span>
                    </a>
                  </div>

                  {/* Sequential Operational Status Workflow Buttons */}
                  <div className="pt-2 border-t border-[#1A2332]">
                    {del.status === "ASSIGNED" && (
                      <button
                        onClick={() => handleUpdateStatus(del.id, "ACCEPTED")}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        Accept Assignment
                      </button>
                    )}

                    {del.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleUpdateStatus(del.id, "PICKED_UP")}
                        className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-purple-600/20"
                      >
                        Confirm Lab / Warehouse Pickup
                      </button>
                    )}

                    {del.status === "PICKED_UP" && (
                      <button
                        onClick={() => handleUpdateStatus(del.id, "OUT_FOR_DELIVERY")}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20"
                      >
                        Mark Out For Delivery
                      </button>
                    )}

                    {del.status === "OUT_FOR_DELIVERY" && (
                      <button
                        onClick={() => openOtpModal(del)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Confirm Handover (Enter Customer OTP)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* COMPLETED DELIVERIES HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {completedDeliveries.map((del) => (
            <div
              key={del.id}
              className="p-4 rounded-xl bg-[#0F141E] border border-[#1A2332] flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-mono font-bold text-white">Order #{del.order?.orderNumber}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Delivered on {formatDate(del.deliveredAt)} • Handover verified by OTP
                </p>
              </div>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
                COMPLETED
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER OTP VERIFICATION MODAL */}
      {otpModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0C1017] border border-[#1A2332] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1A2332] pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Secure Handover Verification</span>
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Order #{selectedDelivery.order?.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setOtpModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs">
              <div>
                <label className="text-gray-300 block mb-1 font-semibold">
                  Customer 6-Digit Delivery OTP
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  Ask the recipient for the 6-digit verification code shown on their EYECAP order screen.
                </p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 492817"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center py-3 text-2xl font-mono tracking-[0.3em] font-bold rounded-xl bg-[#141A26] border border-emerald-500/50 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1">Recipient Name Confirmation</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#141A26] border border-[#1A2332] text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#1A2332]">
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#141A26] text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || enteredOtp.length !== 6}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {verifying ? "Validating Server-Side..." : "Confirm Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
