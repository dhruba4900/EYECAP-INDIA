"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  MapPin,
  LogOut,
  ChevronRight,
  Sparkles,
  Award,
  Key,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "address">("orders");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/account");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingOrders(false);
      }
    }
    if (user) loadOrders();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-eyecap-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen space-y-10">
      {/* Account Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-eyecap-surface via-eyecap-card to-eyecap-surface border border-eyecap-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-eyecap-cyan to-blue-600 flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-eyecap-cyan/20">
            {user.firstName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs text-eyecap-silver font-mono">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-eyecap-card border border-eyecap-border text-eyecap-cyan uppercase">
                EYECAP MEMBER
              </span>
              <span className="text-[10px] font-mono text-eyecap-gold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{user.customerProfile?.loyaltyPoints || 350} Haute Points</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-xl bg-eyecap-card border border-eyecap-border text-rose-400 text-xs font-semibold hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-eyecap-border gap-6 text-xs font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-eyecap-cyan text-eyecap-cyan font-bold"
              : "border-transparent text-eyecap-silver hover:text-white"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Orders & Tracking ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-eyecap-cyan text-eyecap-cyan font-bold"
              : "border-transparent text-eyecap-silver hover:text-white"
          }`}
        >
          <User className="w-4 h-4" /> Optical Profile
        </button>
        <button
          onClick={() => setActiveTab("address")}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "address"
              ? "border-eyecap-cyan text-eyecap-cyan font-bold"
              : "border-transparent text-eyecap-silver hover:text-white"
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-eyecap-surface/40 border border-eyecap-border p-6">
              <ShoppingBag className="w-10 h-10 text-eyecap-muted mx-auto mb-3" />
              <p className="text-white font-semibold text-sm">No orders placed yet</p>
              <p className="text-xs text-eyecap-silver mb-4">Explore our catalog to purchase your first titanium silhouette.</p>
              <Link href="/products" className="px-6 py-2 rounded-full bg-white text-black font-semibold text-xs uppercase">
                Explore Catalog
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-6 rounded-2xl bg-eyecap-surface border border-eyecap-border hover:border-gray-600 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-eyecap-border/60 pb-4">
                  <div>
                    <span className="text-xs font-mono text-eyecap-cyan font-bold">
                      Order #{ord.orderNumber}
                    </span>
                    <span className="text-xs text-eyecap-muted ml-3">
                      {formatDate(ord.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold border ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                          : "bg-eyecap-card text-eyecap-cyan border-eyecap-cyan/30 animate-pulse"
                      }`}
                    >
                      {ord.status.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(ord.total)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-eyecap-muted block mb-1">Items in Shipment</span>
                    <p className="font-medium text-white">
                      {ord.items?.map((i: any) => `${i.productName} (${i.quantity})`).join(", ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-eyecap-muted block mb-1">Destination</span>
                    <p className="text-eyecap-silver truncate">
                      {ord.shippingAddress?.street}, {ord.shippingAddress?.city}
                    </p>
                  </div>
                  <div>
                    <span className="text-eyecap-muted block mb-1">Handover OTP</span>
                    <span className="font-mono text-eyecap-cyan font-bold bg-eyecap-dark px-2 py-0.5 rounded border border-eyecap-border">
                      {ord.deliveryOtp}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/orders/${ord.orderNumber}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-eyecap-cyan hover:underline"
                  >
                    <span>View Live Handover Tracker</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="p-8 rounded-2xl bg-eyecap-surface border border-eyecap-border max-w-2xl space-y-6 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Optical Prescription & Specifications
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-eyecap-muted block mb-1">Prescription Modality</span>
              <p className="font-semibold text-white">
                {user.customerProfile?.prescriptionType || "BlueLight Digital Filter + Single Vision"}
              </p>
            </div>
            <div>
              <span className="text-eyecap-muted block mb-1">Pupillary Distance (PD)</span>
              <p className="font-mono font-semibold text-white">
                {user.customerProfile?.pupillaryDistance ? `${user.customerProfile.pupillaryDistance} mm` : "63.5 mm"}
              </p>
            </div>
            <div>
              <span className="text-eyecap-muted block mb-1">OD (Right Eye Sphere)</span>
              <p className="font-mono text-white">-1.25 D</p>
            </div>
            <div>
              <span className="text-eyecap-muted block mb-1">OS (Left Eye Sphere)</span>
              <p className="font-mono text-white">-1.00 D</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Address */}
      {activeTab === "address" && (
        <div className="p-8 rounded-2xl bg-eyecap-surface border border-eyecap-border max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Primary Delivery Address
          </h3>
          <div className="p-4 rounded-xl bg-eyecap-dark border border-eyecap-border space-y-1">
            <p className="font-bold text-white">{user.firstName} {user.lastName}</p>
            <p className="text-eyecap-silver">742 Evergreen Terrace, Penthouse Suite 4B</p>
            <p className="text-eyecap-silver">San Francisco, CA 94105, United States</p>
            <p className="text-eyecap-muted font-mono">{user.phone || "+1 (555) 392-8810"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
