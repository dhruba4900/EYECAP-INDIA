"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit,
  Archive,
  Eye,
  Check,
  X,
  Boxes,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New product modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    description: "",
    basePrice: "",
    comparePrice: "",
    sku: "",
    categoryId: "",
    frameShape: "Geometric",
    frameMaterial: "Grade 5 Titanium",
    lensMaterial: "Zeiss UV400 Polarized",
    stock: "45",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
    modelType: "geometric",
    frameColor: "#22252A",
    lensColor: "#0F172A",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?search=${search}`);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          setCategories(json.categories || []);
          if (json.categories?.length > 0) {
            setFormData((prev) => ({ ...prev, categoryId: json.categories[0].id }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCats();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setModalOpen(false);
        setFormData({
          name: "",
          headline: "",
          description: "",
          basePrice: "",
          comparePrice: "",
          sku: "",
          categoryId: categories[0]?.id || "",
          frameShape: "Geometric",
          frameMaterial: "Grade 5 Titanium",
          lensMaterial: "Zeiss UV400 Polarized",
          stock: "45",
          imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80",
          modelType: "geometric",
          frameColor: "#22252A",
          lensColor: "#0F172A",
        });
        loadProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create product");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}" from the active catalog?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control catalog offerings, 3D configurations, and variants.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Product Silhouette</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by name, SKU, or material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F121B] border border-[#1C202C] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-[#0F121B] border border-[#1C202C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141824] border-b border-[#1C202C] text-gray-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Silhouette & SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Base Price</th>
                <th className="py-3.5 px-4">Shape & Metallurgy</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202C]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No products matched search query.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#121622] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]?.url || "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=300&q=80"}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-black"
                        />
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="font-mono text-[10px] text-gray-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {p.category?.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(p.basePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      <span className="text-white font-medium">{p.frameShape}</span> • {p.frameMaterial}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                        (p.inventory?.available || 0) <= (p.inventory?.lowStockThreshold || 10)
                          ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                          : "text-emerald-400 bg-emerald-950/40"
                      }`}>
                        {p.inventory?.available || 0} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isPublished ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                          ARCHIVED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-[#181D2D] hover:text-white text-gray-400"
                          title="View on Storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleArchive(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-[#181D2D] hover:text-rose-400 text-gray-400"
                          title="Archive Product"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1118] border border-[#1C202C] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1C202C] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  New Eyewear Product Blueprint
                </h3>
                <p className="text-xs text-gray-400">Configure geometry, 3D render archetype, and initial inventory</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1">Product Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EYECAP Chronos Nova"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">SKU Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EYE-NOV-025"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="380.00"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">Compare Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="440.00"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1">Frame Shape</label>
                  <select
                    value={formData.frameShape}
                    onChange={(e) => setFormData({ ...formData, frameShape: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Geometric">Geometric</option>
                    <option value="Aviator">Aviator</option>
                    <option value="Rectangular">Rectangular</option>
                    <option value="Round">Round</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">3D WebGL Archetype</label>
                  <select
                    value={formData.modelType}
                    onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="geometric">Geometric Octagonal</option>
                    <option value="aviator">Aviator Brow-Bar</option>
                    <option value="rectangular">Rectangular Sleek</option>
                    <option value="smart_audio">Smart Audio Acoustic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1">Frame Metallurgy</label>
                <input
                  type="text"
                  value={formData.frameMaterial}
                  onChange={(e) => setFormData({ ...formData, frameMaterial: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#1C202C] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1C202C]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141824] text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {creating ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
