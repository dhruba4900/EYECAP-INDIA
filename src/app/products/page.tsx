"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { formatCurrency } from "@/lib/utils";

type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder?: number;
  _count?: {
    products?: number;
  };
  productCount?: number;
};

type CatalogResponse = {
  products?: any[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  error?: string;
};

const PAGE_SIZE = 24;
const DEFAULT_MIN_PRICE = "200";
const DEFAULT_MAX_PRICE = "700";

const FRAME_SHAPES = ["Geometric", "Aviator", "Rectangular", "Round"];

function readParam(params: URLSearchParams, key: string, fallback: string) {
  const value = params.get(key);
  return value === null ? fallback : value;
}

function ProductsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [selectedShape, setSelectedShape] = useState(
    searchParams.get("shape") || "all",
  );
  const [minPrice, setMinPrice] = useState(
    readParam(searchParams, "minPrice", DEFAULT_MIN_PRICE),
  );
  const [maxPrice, setMaxPrice] = useState(
    readParam(searchParams, "maxPrice", DEFAULT_MAX_PRICE),
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Keep the UI in sync when the user navigates with browser back/forward
  // or opens a category URL directly.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    setSearch(params.get("search") || "");
    setSelectedCategory(params.get("category") || "all");
    setSelectedShape(params.get("shape") || "all");
    setMinPrice(readParam(params, "minPrice", DEFAULT_MIN_PRICE));
    setMaxPrice(readParam(params, "maxPrice", DEFAULT_MAX_PRICE));
    setSort(params.get("sort") || "featured");
    const pageValue = Number.parseInt(params.get("page") || "1", 10);
    setCurrentPage(Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1);
  }, [searchParams]);

  // Reflect filters in the URL so links can be copied and browser navigation works.
  useEffect(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedShape !== "all") params.set("shape", selectedShape);
    if (minPrice !== DEFAULT_MIN_PRICE) params.set("minPrice", minPrice);
    if (maxPrice !== DEFAULT_MAX_PRICE) params.set("maxPrice", maxPrice);
    if (sort !== "featured") params.set("sort", sort);
    if (currentPage > 1) params.set("page", String(currentPage));

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    pathname,
    router,
    search,
    selectedCategory,
    selectedShape,
    minPrice,
    maxPrice,
    sort,
    currentPage,
    searchParams,
  ]);

  // Load active categories from the category API. This includes admin-created
  // categories, so the catalogue does not need hard-coded category names.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);

      try {
        const response = await fetch("/api/categories", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Could not load categories.");
        }

        const data = await response.json();
        const activeCategories: CatalogCategory[] = Array.isArray(data.categories)
          ? data.categories.filter(
              (category: CatalogCategory) =>
                category &&
                typeof category.id === "string" &&
                typeof category.name === "string" &&
                typeof category.slug === "string",
            )
          : [];

        if (!cancelled) {
          setCategories(
            activeCategories.sort(
              (a, b) =>
                (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
                a.name.localeCompare(b.name),
            ),
          );
        }
      } catch (loadError) {
        console.error("Category loading error:", loadError);
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch products whenever the filters or current page change.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        const trimmedSearch = search.trim();

        if (trimmedSearch) query.set("search", trimmedSearch);
        if (selectedCategory !== "all") {
          query.set("category", selectedCategory);
        }
        if (selectedShape !== "all") query.set("shape", selectedShape);

        // Keep the existing catalogue's default price range.
        if (minPrice !== "") query.set("minPrice", minPrice);
        if (maxPrice !== "") query.set("maxPrice", maxPrice);

        query.set("sort", sort || "featured");
        query.set("page", String(currentPage));
        query.set("limit", String(PAGE_SIZE));

        const response = await fetch(`/api/products?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const data: CatalogResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load products.");
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotalCount(
          Number.isFinite(data.pagination?.total)
            ? Number(data.pagination?.total)
            : 0,
        );
        setTotalPages(
          Math.max(
            1,
            Number.isFinite(data.pagination?.totalPages)
              ? Number(data.pagination?.totalPages)
              : 1,
          ),
        );
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        console.error("Products loading error:", fetchError);
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Something went wrong while loading products.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchProducts();

    return () => controller.abort();
  }, [
    search,
    selectedCategory,
    selectedShape,
    minPrice,
    maxPrice,
    sort,
    currentPage,
    retryCount,
  ]);

  const visibleStart = useMemo(() => {
    if (totalCount === 0) return 0;
    return (currentPage - 1) * PAGE_SIZE + 1;
  }, [currentPage, totalCount]);

  const visibleEnd = useMemo(
    () => Math.min(currentPage * PAGE_SIZE, totalCount),
    [currentPage, totalCount],
  );

  const updateCategory = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
    setMobileFilterOpen(false);
  };

  const updateShape = (shape: string) => {
    setSelectedShape(shape);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedShape("all");
    setMinPrice(DEFAULT_MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setSort("featured");
    setCurrentPage(1);
    setMobileFilterOpen(false);
    router.replace("/products", { scroll: false });
  };

  const renderCategoryFilters = () => (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => updateCategory("all")}
        aria-pressed={selectedCategory === "all"}
        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
          selectedCategory === "all"
            ? "bg-eyecap-card text-eyecap-cyan font-semibold border border-eyecap-cyan/30"
            : "text-gray-400 hover:text-white hover:bg-eyecap-card/50"
        }`}
      >
        <span>All Collections</span>
        <span className="font-mono text-[10px] text-eyecap-muted">
          {totalCount}
        </span>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => updateCategory(category.slug)}
          aria-pressed={selectedCategory === category.slug}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
            selectedCategory === category.slug
              ? "bg-eyecap-card text-eyecap-cyan font-semibold border border-eyecap-cyan/30"
              : "text-gray-400 hover:text-white hover:bg-eyecap-card/50"
          }`}
        >
          <span className="truncate pr-3">{category.name}</span>
          <span className="font-mono text-[10px] text-eyecap-muted">
            {category.productCount ?? category._count?.products ?? 0}
          </span>
        </button>
      ))}

      {categoriesLoading && (
        <p className="px-3 py-2 text-[11px] text-eyecap-muted">
          Loading categories…
        </p>
      )}

      {!categoriesLoading && categories.length === 0 && (
        <p className="px-3 py-2 text-[11px] text-eyecap-muted">
          No categories available.
        </p>
      )}
    </div>
  );

  const renderShapeFilters = () => (
    <div className="grid grid-cols-2 gap-2">
      {["all", ...FRAME_SHAPES].map((shape) => (
        <button
          key={shape}
          type="button"
          onClick={() => updateShape(shape)}
          aria-pressed={selectedShape === shape}
          className={`px-3 py-2 rounded-lg text-xs text-center uppercase font-mono transition-colors border ${
            selectedShape === shape
              ? "border-eyecap-cyan text-eyecap-cyan bg-eyecap-cyan/10 font-bold"
              : "border-eyecap-border text-eyecap-silver hover:text-white hover:border-gray-500"
          }`}
        >
          {shape === "all" ? "All Shapes" : shape}
        </button>
      ))}
    </div>
  );

  const renderPriceFilter = () => (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="catalog-min-price"
            className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver"
          >
            Minimum price
          </label>
          <span className="text-xs font-mono text-eyecap-cyan">
            {formatCurrency(Number(minPrice || 0))}
          </span>
        </div>
        <input
          id="catalog-min-price"
          type="number"
          min="0"
          max={maxPrice || undefined}
          step="10"
          value={minPrice}
          onChange={(event) => {
            setMinPrice(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-lg bg-eyecap-card border border-eyecap-border px-3 py-2 text-xs text-white focus:outline-none focus:border-eyecap-cyan"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="catalog-max-price"
            className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver"
          >
            Maximum price
          </label>
          <span className="text-xs font-mono text-eyecap-cyan font-bold">
            {formatCurrency(Number(maxPrice || 0))}
          </span>
        </div>
        <input
          id="catalog-max-price"
          type="range"
          min={minPrice || "0"}
          max="700"
          step="10"
          value={Math.min(700, Math.max(Number(minPrice || 0), Number(maxPrice || 700)))}
          onChange={(event) => {
            setMaxPrice(event.target.value);
            setCurrentPage(1);
          }}
          className="w-full accent-eyecap-cyan cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-eyecap-muted mt-1">
          <span>{formatCurrency(Number(minPrice || 0))}</span>
          <span>$700</span>
        </div>
      </div>
    </div>
  );

  const renderFilterPanel = (mobile = false) => (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-eyecap-border/50">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-eyecap-cyan" />
          <span>Refine Search</span>
        </h3>
        <button
          type="button"
          onClick={resetFilters}
          className="text-[11px] text-eyecap-muted hover:text-eyecap-cyan transition-colors inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Reset All
        </button>
      </div>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver block mb-3">
          Collection Category
        </h4>
        {renderCategoryFilters()}
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver block mb-3">
          Frame Geometry
        </h4>
        {renderShapeFilters()}
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-eyecap-silver block mb-3">
          Price Range
        </h4>
        {renderPriceFilter()}
      </section>

      {mobile && (
        <button
          type="button"
          onClick={() => setMobileFilterOpen(false)}
          className="w-full rounded-xl bg-eyecap-cyan px-4 py-3 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90"
        >
          Show {totalCount} Results
        </button>
      )}
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Catalogue header */}
      <header className="border-b border-eyecap-border/60 pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-eyecap-cyan">
              High-Precision Eyewear
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              EYECAP Catalog
            </h1>
          </div>
          <div className="text-xs font-mono text-eyecap-silver" aria-live="polite">
            {loading ? (
              "Loading models…"
            ) : (
              <>
                Showing{" "}
                <span className="text-white font-bold">
                  {visibleStart}-{visibleEnd}
                </span>{" "}
                of {totalCount} Models
              </>
            )}
          </div>
        </div>

        {/* Search, sort, and mobile filters */}
        <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-eyecap-muted" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search by model, shape, titanium alloy..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-eyecap-surface border border-eyecap-border text-xs text-white placeholder-eyecap-muted focus:outline-none focus:border-eyecap-cyan transition-colors"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-eyecap-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-eyecap-surface border border-eyecap-border px-3 py-2 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-eyecap-muted" />
              <label htmlFor="catalog-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="catalog-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-eyecap-dark">
                  Featured Models
                </option>
                <option value="price_asc" className="bg-eyecap-dark">
                  Price: Low to High
                </option>
                <option value="price_desc" className="bg-eyecap-dark">
                  Price: High to Low
                </option>
                <option value="rating" className="bg-eyecap-dark">
                  Highest Customer Rating
                </option>
                <option value="newest" className="bg-eyecap-dark">
                  Newest Releases
                </option>
              </select>
            </div>

            <button
              type="button"
              aria-expanded={mobileFilterOpen}
              aria-controls="mobile-catalog-filters"
              onClick={() => setMobileFilterOpen((open) => !open)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-eyecap-surface border border-eyecap-border text-xs text-white"
            >
              {mobileFilterOpen ? (
                <X className="w-3.5 h-3.5" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5" />
              )}
              <span>{mobileFilterOpen ? "Close Filters" : "Filters"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <section
          id="mobile-catalog-filters"
          className="lg:hidden mb-8 rounded-2xl bg-eyecap-surface/60 p-5 sm:p-6 border border-eyecap-border/60"
          aria-label="Product filters"
        >
          {renderFilterPanel(true)}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop filters */}
        <aside
          className="hidden lg:block space-y-8 bg-eyecap-surface/40 p-6 rounded-2xl border border-eyecap-border/60 sticky top-28"
          aria-label="Product filters"
        >
          {renderFilterPanel()}
        </aside>

        {/* Product grid */}
        <section className="lg:col-span-3" aria-label="Product results">
          {error ? (
            <div className="py-16 rounded-2xl bg-eyecap-surface/40 border border-eyecap-border text-center p-8">
              <Sparkles className="w-10 h-10 text-eyecap-muted mb-4 mx-auto" />
              <h2 className="text-lg font-semibold text-white mb-2">
                Could not load the catalogue
              </h2>
              <p className="text-xs text-eyecap-muted max-w-md mx-auto mb-6">
                {error}
              </p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setRetryCount((count) => count + 1);
                }}
                className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-96 rounded-2xl bg-eyecap-card animate-pulse border border-eyecap-border/60"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 rounded-2xl bg-eyecap-surface/40 border border-eyecap-border text-center flex flex-col items-center justify-center p-8">
              <Sparkles className="w-10 h-10 text-eyecap-muted mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">
                No matching silhouettes found
              </h2>
              <p className="text-xs text-eyecap-muted max-w-sm mb-6">
                We couldn&apos;t find any eyewear matching your current filters.
                Try changing the category, shape, or price range.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-between gap-4 border-t border-eyecap-border/60 pt-6"
                  aria-label="Product pagination"
                >
                  <p className="text-xs text-eyecap-muted">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || loading}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-eyecap-border px-3 py-2 text-xs text-white transition-colors hover:border-eyecap-cyan disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages || loading}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-eyecap-border px-3 py-2 text-xs text-white transition-colors hover:border-eyecap-cyan disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen" aria-busy="true" aria-label="Loading catalogue" />}
    >
      <ProductsCatalog />
    </Suspense>
  );
}
