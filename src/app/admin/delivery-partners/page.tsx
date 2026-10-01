"use client";

import React, { useState, useEffect } from "react";
import { Truck, Star, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";

export default function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/delivery-partners");
        if (res.ok) {
          const json = await res.json();
          setPartners(json.partners || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Fleet & Couriers</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage partner dispatch zones, vehicles, and delivery performance ratings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="h-44 rounded-2xl bg-[#0F121B] animate-pulse border border-[#1C202C]" />
        ) : (
          partners.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl bg-[#0F121B] border border-[#1C202C] space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center font-bold text-lg">
                    {p.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{p.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{p.rating}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300 pt-2 border-t border-[#1C202C]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Fleet Vehicle:</span>
                  <span className="font-medium text-white">{p.vehicleType} ({p.vehiclePlate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fulfillment Zone:</span>
                  <span className="text-white">{p.currentZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Shipments:</span>
                  <span className="font-mono text-purple-400 font-bold">{p.activeDeliveriesCount} In-Route</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Deliveries:</span>
                  <span className="font-mono text-emerald-400 font-bold">{p.totalDeliveries} Completed</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On Duty & Connected</span>
                </span>
                <a
                  href={`tel:${p.phone || "+15550192834"}`}
                  className="text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
