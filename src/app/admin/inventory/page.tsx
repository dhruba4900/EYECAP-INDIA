"use client";

import React, { useState, useEffect } from "react";
import { Boxes, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAvailable, setEditAvailable] = useState<number>(0);
  const [editThreshold, setEditThreshold] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      if (res.ok) {
        const json = await res.json();
        setInventory(json.inventory || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setEditAvailable(inv.available);
    setEditThreshold(inv.lowStockThreshold);
  };

  const saveEdit = async (invId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: invId,
          available: editAvailable,
          lowStockThreshold: editThreshold,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        loadInventory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Real-Time Inventory System</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track available, reserved, and sold quantities with automated low-stock warnings.</p>
        </div>
        <button
          onClick={loadInventory}
          className="px-4 py-2 rounded-xl bg-[#0F121B] border border-[#1C202C] text-xs text-gray-300 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#0F121B] border border-[#1C202C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141824] border-b border-[#1C202C] text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Silhouette & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4">Reserved</th>
                <th className="py-3.5 px-4">Sold</th>
                <th className="py-3.5 px-4">Low Stock Alert</th>
                <th className="py-3.5 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202C]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Auditing physical stock levels...
                  </td>
                </tr>
              ) : (
                inventory.map((inv) => {
                  const isLow = inv.available <= inv.lowStockThreshold;
                  const isEditing = editingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-[#121622] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={inv.product?.images[0]?.url || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=80"}
                            alt={inv.product?.name}
                            className="w-9 h-9 rounded-lg object-cover bg-black"
                          />
                          <div>
                            <p className="font-semibold text-white">{inv.product?.name}</p>
                            <p className="font-mono text-[10px] text-gray-400">{inv.product?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {inv.product?.category?.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editAvailable}
                            onChange={(e) => setEditAvailable(parseInt(e.target.value, 10))}
                            className="w-20 px-2 py-1 rounded bg-[#141824] border border-purple-500 text-white font-mono text-xs"
                          />
                        ) : (
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                              isLow
                                ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                                : "text-white"
                            }`}
                          >
                            {inv.available} units
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-400">
                        {inv.reserved} reserved
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {inv.sold} units
                      </td>
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editThreshold}
                            onChange={(e) => setEditThreshold(parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 rounded bg-[#141824] border border-purple-500 text-white font-mono text-xs"
                          />
                        ) : (
                          <span className="font-mono text-gray-400">
                            Threshold: {inv.lowStockThreshold}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(inv.id)}
                              disabled={saving}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(inv)}
                            className="px-3 py-1 rounded-lg bg-[#181D2D] hover:bg-purple-600 hover:text-white text-gray-300 font-mono text-[11px] transition-colors"
                          >
                            Adjust
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
