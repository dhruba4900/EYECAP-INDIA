"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FolderTree,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerImage: string | null;
  displayOrder: number;
  isActive: boolean;
  showInNavigation: boolean;
  productCount?: number;
  _count?: {
    products: number;
  };
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  displayOrder: string;
  isActive: boolean;
  showInNavigation: boolean;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  bannerImage: "",
  displayOrder: "0",
  isActive: true,
  showInNavigation: true,
};

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

async function readApiResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await readApiResponse(response);

      setCategories(
        Array.isArray(data.categories) ? data.categories : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      [
        category.name,
        category.slug,
        category.description ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [categories, search]);

  const totalProducts = useMemo(() => {
    const productIds = new Set<string>();

    // This page receives counts per category, not individual product IDs.
    // Summing the counts gives total category assignments, which may include
    // the same product in more than one category.
    return categories.reduce(
      (total, category) =>
        total +
        (category.productCount ?? category._count?.products ?? 0),
      0
    );
  }, [categories]);

  const activeCount = categories.filter(
    (category) => category.isActive
  ).length;

  const navigationCount = categories.filter(
    (category) => category.isActive && category.showInNavigation
  ).length;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEditing(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      bannerImage: category.bannerImage ?? "",
      displayOrder: String(category.displayOrder ?? 0),
      isActive: category.isActive,
      showInNavigation: category.showInNavigation,
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateForm<K extends keyof CategoryForm>(
    key: K,
    value: CategoryForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    if (name.length > 100) {
      setError("Category name cannot exceed 100 characters.");
      return;
    }

    const displayOrder = Number(form.displayOrder);

    if (
      !Number.isInteger(displayOrder) ||
      !Number.isFinite(displayOrder)
    ) {
      setError("Display order must be a valid integer.");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      description: form.description.trim() || null,
      bannerImage: form.bannerImage.trim() || null,
      displayOrder,
      isActive: form.isActive,
      showInNavigation: form.showInNavigation,
    };

    // Let the API generate a slug from the name when the slug field is empty.
    if (form.slug.trim()) {
      payload.slug = createSlug(form.slug);
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/categories/${editingId}`
          : "/api/admin/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      await readApiResponse(response);

      setSuccess(
        editingId
          ? "Category updated successfully."
          : "Category created successfully."
      );

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save the category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    setError("");
    setSuccess("");
    setActionId(category.id);

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            isActive: !category.isActive,
          }),
        }
      );

      await readApiResponse(response);

      setSuccess(
        category.isActive
          ? "Category deactivated."
          : "Category activated."
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change category status."
      );
    } finally {
      setActionId(null);
    }
  }

  async function toggleNavigation(category: Category) {
    setError("");
    setSuccess("");
    setActionId(category.id);

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            showInNavigation: !category.showInNavigation,
          }),
        }
      );

      await readApiResponse(response);

      setSuccess(
        category.showInNavigation
          ? "Category hidden from navigation."
          : "Category enabled in navigation."
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update navigation visibility."
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\n` +
        "The category and its assignments will be removed. " +
        "Products, images, prices, inventory and order records should be preserved.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setActionId(category.id);

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      await readApiResponse(response);

      setSuccess(`"${category.name}" was deleted.`);

      if (editingId === category.id) {
        resetForm();
      }

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the category."
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#07080B] px-4 py-6 text-gray-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <header className="flex flex-col gap-4 border-b border-[#222532] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-purple-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Admin Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                <FolderTree className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Category Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Organize collections and storefront navigation.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#292D3A] bg-[#11131A] px-4 py-2.5 text-sm text-gray-300 transition hover:border-purple-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss message"
              className="rounded-lg p-1 hover:bg-emerald-500/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#222532] bg-[#0D0F15] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Categories
              </p>
              <FolderTree className="h-5 w-5 text-purple-300" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">
              {categories.length}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              All managed categories
            </p>
          </div>

          <div className="rounded-2xl border border-[#222532] bg-[#0D0F15] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Active Categories
              </p>
              <Check className="h-5 w-5 text-emerald-300" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">
              {activeCount}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Available to the storefront API
            </p>
          </div>

          <div className="rounded-2xl border border-[#222532] bg-[#0D0F15] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Navigation Categories
              </p>
              <Eye className="h-5 w-5 text-cyan-300" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">
              {navigationCount}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Active and enabled for navigation
            </p>
          </div>
        </section>

        {/* Create / edit form */}
        <section
          id="category-form"
          className="overflow-hidden rounded-2xl border border-[#252938] bg-[#0D0F15]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#222532] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-white">
                {editingId ? "Edit Category" : "Create Category"}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Configure category details and visibility.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3A] px-3 py-2 text-xs text-gray-400 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="e.g. Premium Titanium"
                  className="w-full rounded-xl border border-[#292D3A] bg-[#08090D] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-purple-500/60"
                />
              </div>

              <div>
                <label
                  htmlFor="category-slug"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  URL Slug
                </label>
                <input
                  id="category-slug"
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    updateForm("slug", event.target.value)
                  }
                  placeholder={
                    form.name
                      ? createSlug(form.name)
                      : "premium-titanium"
                  }
                  className="w-full rounded-xl border border-[#292D3A] bg-[#08090D] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-purple-500/60"
                />
                <p className="mt-1.5 text-[11px] text-gray-600">
                  Leave blank to generate it from the category name.
                </p>
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe this collection..."
                  className="w-full resize-y rounded-xl border border-[#292D3A] bg-[#08090D] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-purple-500/60"
                />
              </div>

              <div>
                <label
                  htmlFor="category-banner"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Banner Image URL
                </label>
                <input
                  id="category-banner"
                  type="url"
                  value={form.bannerImage}
                  onChange={(event) =>
                    updateForm("bannerImage", event.target.value)
                  }
                  placeholder="https://example.com/banner.webp"
                  className="w-full rounded-xl border border-[#292D3A] bg-[#08090D] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-purple-500/60"
                />

                {form.bannerImage.trim() && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#292D3A] bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.bannerImage}
                      alt="Category banner preview"
                      className="h-32 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      onLoad={(event) => {
                        event.currentTarget.style.display = "block";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="category-order"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Display Order
                </label>
                <input
                  id="category-order"
                  type="number"
                  step={1}
                  value={form.displayOrder}
                  onChange={(event) =>
                    updateForm("displayOrder", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#292D3A] bg-[#08090D] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/60"
                />
                <p className="mt-1.5 text-[11px] text-gray-600">
                  Lower values appear earlier.
                </p>
              </div>

              <div className="flex flex-col justify-center gap-4 rounded-xl border border-[#252938] bg-[#090B10] p-4">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium text-white">
                      Category Active
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Allow the public category API to return it.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateForm("isActive", event.target.checked)
                    }
                    className="h-4 w-4 accent-purple-500"
                  />
                </label>

                <div className="h-px bg-[#222532]" />

                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium text-white">
                      Show in Navigation
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Include it in the storefront navigation API.
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.showInNavigation}
                    onChange={(event) =>
                      updateForm("showInNavigation", event.target.checked)
                    }
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#222532] pt-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Category"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-[#292D3A] px-5 py-3 text-sm text-gray-400 transition hover:text-white disabled:opacity-50"
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        {/* Category listing */}
        <section className="overflow-hidden rounded-2xl border border-[#252938] bg-[#0D0F15]">
          <div className="flex flex-col gap-4 border-b border-[#222532] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-white">
                All Categories
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {filteredCategories.length} of {categories.length} categories
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-[#292D3A] bg-[#08090D] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-purple-500/60"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <FolderTree className="h-9 w-9 text-gray-700" />
              <p className="mt-4 font-medium text-gray-300">
                {categories.length === 0
                  ? "No categories found"
                  : "No matching categories"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {categories.length === 0
                  ? "Create your first category using the form above."
                  : "Try another search term."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-[#222532] bg-[#0A0C11] text-[10px] uppercase tracking-wider text-gray-600">
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-4 py-4 font-medium">Products</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Navigation</th>
                      <th className="px-4 py-4 font-medium">Order</th>
                      <th className="px-6 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map((category) => {
                      const productCount =
                        category.productCount ??
                        category._count?.products ??
                        0;

                      const busy = actionId === category.id;

                      return (
                        <tr
                          key={category.id}
                          className="border-b border-[#1B1E28] transition last:border-0 hover:bg-white/[0.015]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#292D3A] bg-[#141722]">
                                {category.bannerImage ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={category.bannerImage}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FolderTree className="h-5 w-5 text-purple-300" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium text-white">
                                  {category.name}
                                </p>
                                <p className="mt-1 max-w-64 truncate font-mono text-[11px] text-gray-600">
                                  /{category.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                              <Package className="h-3.5 w-3.5 text-gray-500" />
                              {productCount}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                                category.isActive
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : "border-gray-500/20 bg-gray-500/10 text-gray-400"
                              }`}
                            >
                              {category.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs ${
                                category.isActive &&
                                category.showInNavigation
                                  ? "text-cyan-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {category.showInNavigation ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                              {category.showInNavigation
                                ? "Visible"
                                : "Hidden"}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-mono text-xs text-gray-400">
                            {category.displayOrder}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Edit category"
                                onClick={() => startEditing(category)}
                                className="rounded-lg border border-[#292D3A] p-2 text-gray-400 transition hover:border-purple-500/40 hover:text-purple-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title={
                                  category.isActive
                                    ? "Deactivate category"
                                    : "Activate category"
                                }
                                disabled={busy}
                                onClick={() =>
                                  void toggleActive(category)
                                }
                                className="rounded-lg border border-[#292D3A] p-2 text-gray-400 transition hover:text-emerald-300 disabled:opacity-50"
                              >
                                {busy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                title="Toggle navigation visibility"
                                disabled={busy}
                                onClick={() =>
                                  void toggleNavigation(category)
                                }
                                className="rounded-lg border border-[#292D3A] p-2 text-gray-400 transition hover:text-cyan-300 disabled:opacity-50"
                              >
                                {category.showInNavigation ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                title="Delete category"
                                disabled={busy}
                                onClick={() =>
                                  void deleteCategory(category)
                                }
                                className="rounded-lg border border-[#292D3A] p-2 text-gray-400 transition hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredCategories.map((category) => {
                  const productCount =
                    category.productCount ??
                    category._count?.products ??
                    0;

                  const busy = actionId === category.id;

                  return (
                    <article
                      key={category.id}
                      className="rounded-xl border border-[#252938] bg-[#090B10] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#292D3A] bg-[#141722]">
                          {category.bannerImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={category.bannerImage}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderTree className="h-5 w-5 text-purple-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-white">
                            {category.name}
                          </h3>
                          <p className="mt-1 break-all font-mono text-[11px] text-gray-600">
                            /{category.slug}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {productCount} products · Order{" "}
                            {category.displayOrder}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold ${
                            category.isActive
                              ? "border-emerald-500/20 text-emerald-300"
                              : "border-gray-500/20 text-gray-500"
                          }`}
                        >
                          {category.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#222532] pt-3">
                        <button
                          type="button"
                          onClick={() => startEditing(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3A] px-3 py-2 text-xs text-gray-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleActive(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3A] px-3 py-2 text-xs text-gray-300 disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          {category.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void toggleNavigation(category)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3A] px-3 py-2 text-xs text-gray-300 disabled:opacity-50"
                        >
                          {category.showInNavigation ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {category.showInNavigation
                            ? "Hide from nav"
                            : "Show in nav"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteCategory(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <p className="text-center text-[11px] leading-relaxed text-gray-600">
          Category deletion should remove category assignments only. Verify
          that your category DELETE API preserves products and their related
          records.
        </p>
      </div>
    </main>
  );
}