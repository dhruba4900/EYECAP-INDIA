"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, Sparkles } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { formatCurrency } from "@/lib/utils";

function ProductsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedShape, setSelectedShape] = useState(searchParams.get("shape") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "200");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "700");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.set("search", search);
        if (selectedCategory && selectedCategory !== "all") query.set("category", selectedCategory);
        if (selectedShape && selectedShape !== "all") query.set("shape", selectedShape);
        if (minPrice) query.set("minPrice", minPrice);
        if (maxPrice) query.set("maxPrice", maxPrice);
        if (sort) query.set("sort", sort);
        query.set("limit", "24");

        const res = await fetch(`/api/products?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setTotalCount(data.pagination?.total || 0);
        }
      } catch (e) {
        console.error("Products error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [search, selectedCategory, selectedShape, minPrice, maxPrice, sort]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCategories();
  }, []);

  const shapes = ["Geometric", "Aviator", "Rectangular", "Round"];

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShape("all");
    setMinPrice("200");
    setMaxPrice("700");
    setSort("featured");
    router.push("/products");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="border-b border-eyecap-border/60 pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
              High-Precision Eyewear
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              EYECAP Catalog
            </h1>
          </div>
          <div className="text-xs font-mono text-eyecap-silver">
            Showing <span className="text-white font-bold">{products.length}</span> of {totalCount} Models
          </div>
        </div>

        {/* Search & Mobile Filter Bar */}
        <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-eyecap-muted" />
            <input
              type="text"
              placeholder="Search by model, shape, titanium alloy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-eyecap-surface border border-eyecap-border text-xs text-white placeholder-eyecap-muted focus:outline-none focus:border-eyecap-cyan transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-eyecap-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Select */}
            <div className="flex items-center gap-2 bg-eyecap-surface border border-eyecap-border px-3 py-2 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-eyecap-muted" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-eyecap-dark">Featured Models</option>
                <option value="price_asc" className="bg-eyecap-dark">Price: Low to High</option>
                <option value="price_desc" className="bg-eyecap-dark">Price: High to Low</option>
                <option value="rating" className="bg-eyecap-dark">Highest Customer Rating</option>
                <option value="newest" className="bg-eyecap-dark">Newest Releases</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-eyecap-surface border border-eyecap-border text-xs text-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block space-y-8 bg-eyecap-surface/40 p-6 rounded-2xl border border-eyecap-border/60 sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-eyecap-border/50">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-eyecap-cyan" />
              <span>Refine Search</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-[11px] text-eyecap-muted hover:text-eyecap-cyan transition-colors"
            >
              Reset All
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver block mb-3">
              Collection Category
            </label>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCategory === "all"
                    ? "bg-eyecap-card text-eyecap-cyan font-semibold border border-eyecap-cyan/30"
                    : "text-gray-400 hover:text-white hover:bg-eyecap-card/50"
                }`}
              >
                <span>All Collections</span>
                <span className="font-mono text-[10px] text-eyecap-muted">{totalCount}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === c.slug
                      ? "bg-eyecap-card text-eyecap-cyan font-semibold border border-eyecap-cyan/30"
                      : "text-gray-400 hover:text-white hover:bg-eyecap-card/50"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-[10px] text-eyecap-muted">{c._count?.products || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frame Shape */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver block mb-3">
              Frame Geometry
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["all", ...shapes].map((shape) => (
                <button
                  key={shape}
                  onClick={() => setSelectedShape(shape)}
                  className={`px-3 py-2 rounded-lg text-xs text-center uppercase font-mono transition-colors border ${
                    selectedShape === shape
                      ? "border-eyecap-cyan text-eyecap-cyan bg-eyecap-cyan/10 font-bold"
                      : "border-eyecap-border text-eyecap-silver hover:text-white hover:border-gray-500"
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver">
                Price Ceiling
              </label>
              <span className="text-xs font-mono text-eyecap-cyan font-bold">
                {formatCurrency(Number(maxPrice))}
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="700"
              step="20"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-eyecap-cyan cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-eyecap-muted mt-1">
              <span>$200</span>
              <span>$700</span>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border/60"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 rounded-2xl bg-eyecap-surface/40 border border-eyecap-border text-center flex flex-col items-center justify-center p-8">
              <Sparkles className="w-10 h-10 text-eyecap-muted mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No matching silhouettes found</h3>
              <p className="text-xs text-eyecap-muted max-w-sm mb-6">
                We couldn't find any eyewear matching your current filter criteria. Try resetting your price or shape options.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <ProductsCatalog />
    </Suspense>
  );
}
