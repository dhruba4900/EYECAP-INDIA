"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  AlertCircle,
  Eye,
  UserCheck,
  X,
  Phone,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Assign Delivery Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}&search=${search}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch("/api/admin/delivery-partners");
        if (res.ok) {
          const json = await res.json();
          setPartners(json.partners || []);
          if (json.partners?.length > 0) {
            setSelectedPartnerId(json.partners[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadPartners();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAssignModal = (order: any) => {
    setSelectedOrder(order);
    setAssignModalOpen(true);
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedPartnerId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedPartnerId }),
      });
      if (res.ok) {
        setAssignModalOpen(false);
        loadOrders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to assign courier");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssigning(false);
    }
  };

  const statuses = [
    "ALL",
    "ORDER_PLACED",
    "PAYMENT_CONFIRMED",
    "PROCESSING",
    "PACKED",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Order Fulfillment Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control order status lifecycle and assign couriers for secure handover.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F121B] border border-[#1C202C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 bg-[#0F121B] border border-[#1C202C] px-3 py-2 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s} className="bg-[#0A0C12]">
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#0F121B] border border-[#1C202C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141824] border-b border-[#1C202C] text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Order Ref & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">Assigned Courier</th>
                <th className="py-3.5 px-4">Handover OTP</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202C]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Querying orders pipeline...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No orders matching selected criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#121622] transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-white">{ord.orderNumber}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(ord.createdAt)}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-white">
                        {ord.user?.firstName} {ord.user?.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{ord.user?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {ord.items?.length || 0} silh.
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(ord.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className={`text-[11px] font-mono px-2 py-1 rounded border bg-[#141824] cursor-pointer ${
                          ord.status === "DELIVERED"
                            ? "text-emerald-400 border-emerald-800/60"
                            : "text-purple-300 border-purple-800/50"
                        }`}
                      >
                        {statuses
                          .filter((s) => s !== "ALL")
                          .map((st) => (
                            <option key={st} value={st} className="bg-[#0A0C12]">
                              {st}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      {ord.delivery?.partner ? (
                        <div className="flex items-center gap-1.5 text-xs text-white">
                          <Truck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{ord.delivery.partner.user?.firstName} {ord.delivery.partner.user?.lastName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openAssignModal(ord)}
                          className="px-2.5 py-1 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60 text-[11px] font-mono transition-colors"
                        >
                          + Assign Courier
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-eyecap-cyan font-bold bg-[#141824] px-2 py-0.5 rounded border border-[#1C202C]">
                        {ord.deliveryOtp}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${ord.orderNumber}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-[#181D2D] hover:text-white text-gray-400 inline-block"
                        title="View Public Tracker"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN COURIER MODAL */}
      {assignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1118] border border-[#1C202C] rounded-3xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1C202C] pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Assign Delivery Courier
                </h3>
                <p className="text-xs text-gray-400 font-mono">Order #{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDelivery} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-300 block mb-2 font-semibold">
                  Select Available Partner
                </label>
                <div className="space-y-2">
                  {partners.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedPartnerId === p.id
                          ? "border-purple-500 bg-purple-950/20 text-white font-semibold"
                          : "border-[#1C202C] bg-[#141824] text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="courierPartner"
                          value={p.id}
                          checked={selectedPartnerId === p.id}
                          onChange={(e) => setSelectedPartnerId(e.target.value)}
                          className="accent-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.vehicleType} • {p.currentZone}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400">
                        ⭐ {p.rating}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#1C202C]">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141824] text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {assigning ? "Assigning..." : "Confirm Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
