"use client";

import React, {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  ImagePlus,
  Package,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Video,
  X,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
};

type Glass = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  material?: string | null;
  priceAdjustment: number;
  isActive: boolean;
  displayOrder?: number;
};

type Product = {
  id: string;
  name: string;
  modelNumber: string;
  sku: string;
  slug: string;
  basePrice: number;
  comparePrice?: number | null;
  discountPercent: number;
  category?: {
    id: string;
    name: string;
  } | null;
  productCategories?: {
    categoryId?: string;
    category?: { id: string; name?: string } | null;
  }[];
  brand?: string | null;
  headline?: string | null;
  description?: string;
  specifications?: string | Record<string, unknown> | null;
  tags?: string | string[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | Date | null;
  releaseDate?: string | Date | null;
  isFeatured?: boolean;
  isNew?: boolean;
  frameShape?: string | null;
  frameMaterial?: string | null;
  lensMaterial?: string | null;
  lensWidthMm?: number | null;
  bridgeWidthMm?: number | null;
  templeLengthMm?: number | null;
  totalWeightG?: number | null;
  genderStyle?: string | null;
  gsm?: number | null;
  glassLinks?: { glassId?: string; glass?: { id: string } | null }[];
  inventory?: {
    available: number;
    reserved: number;
    sold: number;
    lowStockThreshold: number;
  } | null;
  images?: {
    id: string;
    url: string;
    isPrimary: boolean;
    displayOrder?: number;
  }[];
  productVideos?: {
    id: string;
    url: string;
    isBackground?: boolean;
  }[];
  isPublished: boolean;
};

type ProductForm = {
  name: string;
  modelNumber: string;
  sku: string;
  brand: string;
  headline: string;
  description: string;
  categoryId: string;
  categoryIds: string[];

  basePrice: string;
  discountPercent: string;
  comparePrice: string;

  frameShape: string;
  frameMaterial: string;
  lensMaterial: string;
  gsm: string;

  lensWidthMm: string;
  bridgeWidthMm: string;
  templeLengthMm: string;
  totalWeightG: string;

  genderStyle: string;

  stock: string;
  lowStockThreshold: string;

  tags: string;
  specifications: string;

  seoTitle: string;
  seoDescription: string;

  releaseDate: string;
  publishedAt: string;

  isPublished: boolean;

  glassOptionIds: string[];
};

const emptyForm: ProductForm = {
  name: "",
  modelNumber: "",
  sku: "",
  brand: "EYECAP",
  headline: "",
  description: "",
  categoryId: "",
  categoryIds: [],

  basePrice: "",
  discountPercent: "0",
  comparePrice: "",

  frameShape: "Geometric",
  frameMaterial: "Grade 5 Titanium",
  lensMaterial: "Polycarbonate UV400 Polarized",
  gsm: "",

  lensWidthMm: "53",
  bridgeWidthMm: "18",
  templeLengthMm: "145",
  totalWeightG: "18",

  genderStyle: "Unisex",

  stock: "0",
  lowStockThreshold: "10",

  tags: "",
  specifications: "{}",

  seoTitle: "",
  seoDescription: "",

  releaseDate: "",
  publishedAt: "",

  isPublished: false,

  glassOptionIds: [],
};

const tabs = [
  ["identity", "Identity"],
  ["content", "Content"],
  ["media", "Media"],
  ["pricing", "Pricing"],
  ["specs", "Specifications"],
  ["glass", "Glass"],
  ["stock", "Inventory"],
  ["publishing", "Publishing"],
  ["seo", "SEO"],
] as const;

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatINR(value: number) {
  if (!Number.isFinite(value)) return "₹0.00";
  return INR_FORMATTER.format(value);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function Section({
  id,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-2xl border border-[#1b314b] bg-[#07111f]/90 shadow-[0_16px_50px_rgba(0,0,0,.18)]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 border-b border-[#162941] px-5 py-4 text-left transition hover:bg-[#0a1728]"
      >
        <span>
          <span className="block text-sm font-semibold text-white">
            {title}
          </span>

          <span className="mt-0.5 block text-[11px] text-slate-400">
            {subtitle}
          </span>
        </span>

        {open ? (
          <ChevronUp className="h-4 w-4 text-cyan-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {open && <div className="p-5">{children}</div>}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  step,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
        {label}{" "}
        {required && <span className="text-cyan-300">*</span>}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10"
      />
    </label>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [glasses, setGlasses] = useState<Glass[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number][0]>("identity");

  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    []
  );

  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(
      tabs.map(([key]) => [
        key,
        key === "identity" || key === "pricing",
      ])
    )
  );

  const update = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const discountPercent = useMemo(() => {
    const raw = Number(form.discountPercent);

    if (!Number.isFinite(raw)) return 0;

    return Math.min(100, Math.max(0, raw));
  }, [form.discountPercent]);

  const originalPrice = useMemo(() => {
    const value = Number(form.basePrice);

    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return value;
  }, [form.basePrice]);

  const discountedPrice = useMemo(() => {
    if (originalPrice <= 0) return 0;

    return roundMoney(
      Math.max(
        0,
        originalPrice - originalPrice * (discountPercent / 100)
      )
    );
  }, [originalPrice, discountPercent]);

  const discountAmount = useMemo(() => {
    return roundMoney(Math.max(0, originalPrice - discountedPrice));
  }, [originalPrice, discountedPrice]);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/products?search=${encodeURIComponent(search)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load products");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMetadata() {
    setMetadataLoading(true);

    try {
      const [categoryResponse, glassResponse] =
        await Promise.all([
          fetch("/api/admin/categories", {
            cache: "no-store",
          }),

          fetch("/api/admin/glasses", {
            cache: "no-store",
          }),
        ]);

      if (categoryResponse.ok) {
        const data = await categoryResponse.json();

        const nextCategories: Category[] = Array.isArray(
          data.categories
        )
          ? data.categories
          : [];

        setCategories(nextCategories);

        if (nextCategories.length > 0) {
          setForm((current) => {
            if (current.categoryIds.length > 0) {
              return current;
            }

            const initialCategoryId =
              current.categoryId || nextCategories.find((category) => category.isActive)?.id || "";

            return {
              ...current,
              categoryId: initialCategoryId,
              categoryIds: [initialCategoryId],
            };
          });
        }
      }

      if (glassResponse.ok) {
        const data = await glassResponse.json();

        setGlasses(
          Array.isArray(data.glasses)
            ? data.glasses
            : []
        );
      }
    } catch {
      // Metadata errors are handled contextually.
    } finally {
      setMetadataLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [search]);

  useEffect(() => {
    void loadMetadata();
  }, []);

  function resetMessages() {
    setError("");
    setMessage("");
  }

  function openCreate() {
    resetMessages();
    setEditingProductId(null);

    setActiveTab("identity");

    setSections(
      Object.fromEntries(
        tabs.map(([key]) => [
          key,
          key === "identity" || key === "pricing",
        ])
      )
    );

    const initialCategoryId = categories.find((category) => category.isActive)?.id || "";

    setForm({
      ...emptyForm,
      categoryId: initialCategoryId,
      categoryIds: initialCategoryId ? [initialCategoryId] : [],
    });

    setModalOpen(true);
  }

  function openEdit(product: Product) {
    resetMessages();
    setActiveTab("identity");
    setSections(
      Object.fromEntries(
        tabs.map(([key]) => [key, key === "identity" || key === "pricing"])
      )
    );

    const linkedCategoryIds = (product.productCategories || [])
      .map((item) => item.categoryId || item.category?.id || "")
      .filter(Boolean);
    const categoryIds = Array.from(
      new Set(linkedCategoryIds.length ? linkedCategoryIds : product.category?.id ? [product.category.id] : [])
    );

    const rawSpecifications = product.specifications;
    const specifications = typeof rawSpecifications === "string"
      ? rawSpecifications
      : rawSpecifications && typeof rawSpecifications === "object"
        ? JSON.stringify(rawSpecifications, null, 2)
        : "{}";

    let tagValues: string[] = [];
    if (Array.isArray(product.tags)) {
      tagValues = product.tags.map(String);
    } else if (typeof product.tags === "string" && product.tags.trim()) {
      try {
        const parsedTags: unknown = JSON.parse(product.tags);
        tagValues = Array.isArray(parsedTags) ? parsedTags.map(String) : product.tags.split(",");
      } catch {
        tagValues = product.tags.split(",");
      }
    }

    const dateValue = (value: unknown, withTime = false): string => {
      if (!value) return "";
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) return "";
      return withTime ? date.toISOString().slice(0, 16) : date.toISOString().slice(0, 10);
    };

    setForm({
      ...emptyForm,
      name: product.name || "",
      modelNumber: product.modelNumber || "",
      sku: product.sku || "",
      brand: product.brand || "EYECAP",
      headline: product.headline || "",
      description: product.description || "",
      categoryId: categoryIds[0] || product.category?.id || "",
      categoryIds,
      basePrice: String(product.basePrice ?? ""),
      discountPercent: String(product.discountPercent ?? 0),
      comparePrice: product.comparePrice == null ? "" : String(product.comparePrice),
      frameShape: product.frameShape || "Geometric",
      frameMaterial: product.frameMaterial || "Grade 5 Titanium",
      lensMaterial: product.lensMaterial || "Polycarbonate UV400 Polarized",
      gsm: product.gsm == null ? "" : String(product.gsm),
      lensWidthMm: String(product.lensWidthMm ?? 53),
      bridgeWidthMm: String(product.bridgeWidthMm ?? 18),
      templeLengthMm: String(product.templeLengthMm ?? 145),
      totalWeightG: String(product.totalWeightG ?? 18),
      genderStyle: product.genderStyle || "Unisex",
      stock: String(product.inventory?.available ?? 0),
      lowStockThreshold: String(product.inventory?.lowStockThreshold ?? 10),
      tags: tagValues.map((tag) => tag.trim()).filter(Boolean).join(", "),
      specifications: specifications || "{}",
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
      releaseDate: dateValue(product.releaseDate),
      publishedAt: dateValue(product.publishedAt, true),
      isPublished: Boolean(product.isPublished),
      glassOptionIds: (product.glassLinks || [])
        .map((item) => item.glassId || item.glass?.id || "")
        .filter(Boolean),
    });

    setEditingProductId(product.id);
    setModalOpen(true);
  }

  function toggleCategory(categoryId: string) {
    setForm((current) => {
      const alreadySelected = current.categoryIds.includes(categoryId);
      const categoryIds = alreadySelected
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId];

      return {
        ...current,
        categoryIds,
        // Keep the legacy single-category field synchronized for compatibility.
        categoryId: categoryIds[0] || "",
      };
    });
  }

  function toggleSection(key: string) {
    setSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleGlass(glassId: string) {
    const exists = form.glassOptionIds.includes(glassId);

    update(
      "glassOptionIds",
      exists
        ? form.glassOptionIds.filter(
            (id) => id !== glassId
          )
        : [...form.glassOptionIds, glassId]
    );
  }

  function validateProductForm() {
    const name = form.name.trim();
    const modelNumber = form.modelNumber.trim();
    const sku = form.sku.trim();
    const description = form.description.trim();

    const price = Number(form.basePrice);
    const discount = Number(form.discountPercent || 0);
    const stock = Number(form.stock || 0);
    const threshold = Number(
      form.lowStockThreshold || 0
    );

    if (!name) {
      return "Product name is required.";
    }

    if (!modelNumber) {
      return "Model number is required.";
    }

    if (!sku) {
      return "SKU is required.";
    }

    if (!description) {
      return "Product description is required.";
    }

    if (form.categoryIds.length === 0) {
      return "Please select at least one product category.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Please enter a valid INR price.";
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      return "Discount must be between 0% and 100%.";
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return "Initial stock cannot be negative.";
    }

    if (
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      return "Low-stock threshold cannot be negative.";
    }

    if (form.specifications.trim()) {
      try {
        const parsed = JSON.parse(
          form.specifications
        );

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          return "Specifications must be a JSON object.";
        }
      } catch {
        return "Specifications contains invalid JSON.";
      }
    }

    return null;
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();

    resetMessages();

    const validationError = validateProductForm();

    if (validationError) {
      setError(validationError);

      const target =
        validationError.includes("price") ||
        validationError.includes("Discount")
          ? "pricing"
          : validationError.includes("stock")
            ? "stock"
            : validationError.includes(
                  "Specifications"
                )
              ? "specs"
              : "identity";

      setActiveTab(target as (typeof tabs)[number][0]);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        name: form.name.trim(),
        modelNumber: form.modelNumber.trim().toUpperCase(),
        sku: form.sku.trim().toUpperCase(),
        brand: form.brand.trim(),
        headline: form.headline.trim(),
        description: form.description.trim(),

        basePrice: Number(form.basePrice),

        discountPercent: Math.min(
          100,
          Math.max(
            0,
            Number(form.discountPercent || 0)
          )
        ),

        comparePrice:
          form.comparePrice.trim() === ""
            ? null
            : Number(form.comparePrice),

        gsm:
          form.gsm.trim() === ""
            ? null
            : Number(form.gsm),

        lensWidthMm: Number(
          form.lensWidthMm || 53
        ),

        bridgeWidthMm: Number(
          form.bridgeWidthMm || 18
        ),

        templeLengthMm: Number(
          form.templeLengthMm || 145
        ),

        totalWeightG: Number(
          form.totalWeightG || 18
        ),

        stock: Number(form.stock || 0),

        lowStockThreshold: Number(
          form.lowStockThreshold || 10
        ),

        releaseDate:
          form.releaseDate || null,

        publishedAt:
          form.publishedAt || null,

        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        specifications:
          form.specifications.trim() || "{}",

        // Keep the first selected category for legacy Product.categoryId consumers.
        categoryId: form.categoryIds[0] || "",
        // The admin API must persist these IDs through ProductCategory.
        categoryIds: Array.from(new Set(form.categoryIds)),

        /*
         * IMPORTANT:
         * Glass selection was previously kept only in UI.
         * It is now explicitly sent to the API.
         */
        glassOptionIds: form.glassOptionIds,
      };

      const isEditing = Boolean(editingProductId);
      const endpoint = isEditing
        ? `/api/admin/products/${editingProductId}`
        : "/api/admin/products";

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditing ? "Failed to update product" : "Failed to create product")
        );
      }

      const createdModelNumber = data.product?.modelNumber ?? "unknown";

      setMessage(
        isEditing
          ? `Product ${createdModelNumber} updated successfully.`
          : `Product ${createdModelNumber} created successfully.`
      );

      setModalOpen(false);
      setEditingProductId(null);

      const initialCategoryId = categories.find((category) => category.isActive)?.id || "";

      setForm({
        ...emptyForm,
        categoryId: initialCategoryId,
        categoryIds: initialCategoryId ? [initialCategoryId] : [],
      });

      setSelectedProductIds([]);

      await loadProducts();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : editingProductId
            ? "Failed to update product"
            : "Failed to create product"
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(product: Product) {
    const confirmed = window.confirm(
      `Archive "${product.name}" (${product.modelNumber})?\n\nThis will remove it from the active catalog.`
    );

    if (!confirmed) return;

    resetMessages();

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to archive product"
        );
      }

      setSelectedProductIds((current) =>
        current.filter(
          (id) => id !== product.id
        )
      );

      setMessage(
        `${product.name} archived successfully.`
      );

      await loadProducts();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to archive product"
      );
    }
  }

  async function bulkDiscount() {
    const selected = selectedProductIds;

    if (!selected.length) {
      setError(
        "Select at least one product before applying a bulk discount."
      );
      return;
    }

    const raw = window.prompt(
      `Discount percentage for ${selected.length} selected product(s) (1–100):`,
      "10"
    );

    if (raw === null) return;

    const percent = Number(raw);

    if (
      !Number.isFinite(percent) ||
      percent < 1 ||
      percent > 100
    ) {
      setError(
        "Discount must be between 1 and 100."
      );
      return;
    }

    resetMessages();

    try {
      const response = await fetch(
        "/api/admin/products/bulk-discount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productIds: selected,
            discountPercent: percent,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Bulk discount failed"
        );
      }

      setMessage(
        `${data.updatedCount || selected.length} product(s) updated to ${percent}% discount.`
      );

      await loadProducts();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Bulk discount failed."
      );
    }
  }

  function clearSelectedProducts() {
    setSelectedProductIds([]);
  }

  const activeGlasses = glasses
    .filter((glass) => glass.isActive)
    .sort(
      (a, b) =>
        (a.displayOrder || 0) -
        (b.displayOrder || 0)
    );

  return (
    <div className="min-h-full space-y-6 text-slate-200">
      {/* HEADER */}
      <header className="rounded-3xl border border-[#163552] bg-[radial-gradient(circle_at_top_right,#0b2a48,transparent_42%),#060e18] p-6 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Product Catalog
                </h1>

                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-300">
                  Production
                </span>

                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-300">
                  INR · ₹
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Manage product identity, pricing, media,
                specifications, glass availability,
                inventory and publishing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={bulkDiscount}
              disabled={!selectedProductIds.length}
              className="inline-flex items-center gap-2 rounded-xl border border-[#234361] bg-[#091827] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Percent className="h-4 w-4 text-cyan-300" />

              Bulk Discount

              {selectedProductIds.length > 0 && (
                <span className="rounded-full bg-cyan-400/10 px-1.5 py-0.5 text-[9px] text-cyan-300">
                  {selectedProductIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-[#04101b] shadow-[0_10px_30px_rgba(34,211,238,.18)] transition hover:bg-cyan-300 active:scale-[.98]"
            >
              <Plus className="h-4 w-4" />
              New Product
            </button>
          </div>
        </div>
      </header>

      {/* ALERT */}
      {(error || message) && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-500/20 bg-rose-500/5 text-rose-200"
              : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          )}

          <span>{error || message}</span>

          <button
            type="button"
            onClick={resetMessages}
            className="ml-auto text-slate-500 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* SEARCH */}
      <div className="rounded-2xl border border-[#172d45] bg-[#07111f] p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search name, model number or SKU..."
              className="w-full rounded-xl border border-[#1e3954] bg-[#081321] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-400/60"
            />
          </div>

          {selectedProductIds.length > 0 && (
            <button
              type="button"
              onClick={clearSelectedProducts}
              className="rounded-xl border border-[#203a56] bg-[#0a1726] px-4 py-3 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Clear {selectedProductIds.length} selected
            </button>
          )}

          <button
            type="button"
            onClick={() => void loadProducts()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#203a56] bg-[#0a1726] px-4 py-3 text-xs font-semibold text-slate-300 transition hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#172d45] bg-[#06101c]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="border-b border-[#172d45] bg-[#091827] text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 &&
                      selectedProductIds.length ===
                        products.length
                    }
                    onChange={(e) =>
                      setSelectedProductIds(
                        e.target.checked
                          ? products.map(
                              (product) =>
                                product.id
                            )
                          : []
                      )
                    }
                    className="h-4 w-4 accent-cyan-400"
                    aria-label="Select all visible products"
                  />
                </th>

                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-4 py-4">
                  Model / SKU
                </th>

                <th className="px-4 py-4">
                  Price
                </th>

                <th className="px-4 py-4">
                  Stock
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

                <th className="px-4 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#12263b]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading catalog…
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock =
                    product.inventory?.available ??
                    0;

                  const threshold =
                    product.inventory
                      ?.lowStockThreshold ?? 10;

                  const low =
                    stock > 0 &&
                    stock <= threshold;

                  const price = roundMoney(
                    Math.max(
                      0,
                      product.basePrice *
                        (1 -
                          (product.discountPercent ||
                            0) /
                            100)
                    )
                  );

                  const selected =
                    selectedProductIds.includes(
                      product.id
                    );

                  return (
                    <tr
                      key={product.id}
                      className={`transition hover:bg-[#081727] ${
                        selected
                          ? "bg-cyan-400/[0.025]"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) =>
                            setSelectedProductIds(
                              (current) =>
                                e.target.checked
                                  ? [
                                      ...current,
                                      product.id,
                                    ]
                                  : current.filter(
                                      (id) =>
                                        id !==
                                        product.id
                                    )
                            )
                          }
                          className="h-4 w-4 accent-cyan-400"
                          aria-label={`Select ${product.name}`}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-[#1c3a55] bg-black">
                            {product.images?.[0]
                              ?.url ? (
                              <img
                                src={
                                  product
                                    .images[0]
                                    .url
                                }
                                alt={
                                  product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="m-auto mt-3 h-5 w-5 text-slate-600" />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {product.name}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                              {product.category
                                ?.name ||
                                "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-mono text-cyan-300">
                          {product.modelNumber ||
                            "—"}
                        </p>

                        <p className="mt-1 font-mono text-[10px] text-slate-500">
                          {product.sku}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {product.discountPercent >
                        0 ? (
                          <>
                            <p className="font-semibold text-white">
                              {formatINR(price)}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500 line-through">
                              {formatINR(
                                product.basePrice
                              )}
                            </p>

                            <p className="mt-1 text-[9px] font-semibold text-cyan-300">
                              {
                                product.discountPercent
                              }
                              % OFF
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-white">
                            {formatINR(
                              product.basePrice
                            )}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                            stock === 0
                              ? "border-rose-400/20 bg-rose-400/5 text-rose-300"
                              : low
                                ? "border-amber-400/20 bg-amber-400/5 text-amber-300"
                                : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                          }`}
                        >
                          {stock === 0
                            ? "OUT OF STOCK"
                            : low
                              ? `FEW LEFT · ${stock}`
                              : `IN STOCK · ${stock}`}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            product.isPublished
                              ? "bg-cyan-400/10 text-cyan-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {product.isPublished
                            ? "PUBLISHED"
                            : "DRAFT"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-2 text-cyan-300 transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
                            title={`Edit ${product.name}`}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="rounded-lg border border-[#1e3954] bg-[#091827] p-2 text-slate-400 transition hover:text-cyan-300"
                            title="View product"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              void archiveProduct(
                                product
                              )
                            }
                            className="rounded-lg border border-[#1e3954] bg-[#091827] p-2 text-slate-400 transition hover:border-rose-400/30 hover:text-rose-300"
                            title="Archive product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#1d3d5a] bg-[#050d17] shadow-[0_30px_120px_rgba(0,0,0,.65)]">
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#162d44] px-6 py-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.22em] text-cyan-300">
                  EYECAP PRODUCT BUILDER
                </p>

                <h2 className="mt-1 text-xl font-bold text-white">
                  {editingProductId ? "Edit Product" : "Create New Product"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-xl border border-[#203a56] p-2 text-slate-400 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {/* TABS */}
              <aside className="shrink-0 border-b border-[#162d44] bg-[#06111e] p-3 md:w-56 md:border-b-0 md:border-r">
                <div className="flex gap-1 overflow-x-auto md:block md:space-y-1">
                  {tabs.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setActiveTab(key)
                      }
                      className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-medium transition md:block md:w-full ${
                        activeTab === key
                          ? "bg-cyan-400/10 text-cyan-300"
                          : "text-slate-500 hover:bg-[#0a1726] hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </aside>

              {/* FORM */}
              <form
                onSubmit={submitProduct}
                className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
              >
                <div className="space-y-4">
                  {/* IDENTITY */}
                  <Section
                    id="identity"
                    title="Product Identity"
                    subtitle="Permanent model identity and catalog reference."
                    open={
                      activeTab === "identity" ||
                      sections.identity
                    }
                    onToggle={() =>
                      toggleSection("identity")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Product name"
                        value={form.name}
                        required
                        onChange={(v) =>
                          update("name", v)
                        }
                        placeholder="EYECAP Chronos Nova"
                      />

                      <Field
                        label="Model number"
                        value={form.modelNumber}
                        required
                        onChange={(v) =>
                          update(
                            "modelNumber",
                            v.toUpperCase()
                          )
                        }
                        placeholder="EYE-CHR-001"
                      />

                      <Field
                        label="SKU"
                        value={form.sku}
                        required
                        onChange={(v) =>
                          update(
                            "sku",
                            v.toUpperCase()
                          )
                        }
                        placeholder="EYE-CHR-001-BLK"
                      />

                      <Field
                        label="Brand"
                        value={form.brand}
                        onChange={(v) =>
                          update("brand", v)
                        }
                        placeholder="EYECAP"
                      />

                      <div className="space-y-2.5 sm:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                            Product categories{" "}
                            <span className="text-cyan-300">*</span>
                          </span>
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
                            {form.categoryIds.length} selected
                          </span>
                        </div>

                        <p className="text-[11px] leading-5 text-slate-500">
                          Select one or more categories. A product can appear in every selected
                          category on the storefront.
                        </p>

                        {metadataLoading ? (
                          <div className="flex items-center gap-2 rounded-xl border border-[#203a56] bg-[#081321] p-4 text-xs text-slate-400">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Loading categories…
                          </div>
                        ) : categories.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => {
                              const selected = form.categoryIds.includes(category.id);

                              return (
                                <label
                                  key={category.id}
                                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                                    selected
                                      ? "border-cyan-400/40 bg-cyan-400/10"
                                      : "border-[#203a56] bg-[#081321] hover:border-[#315a7d]"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    disabled={category.isActive === false && !selected}
                                    onChange={() => toggleCategory(category.id)}
                                    className="h-4 w-4 shrink-0 accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  />
                                  <span className="min-w-0 flex-1 text-sm text-slate-200">
                                    {category.name}
                                    {category.isActive === false && (
                                      <span className="ml-2 text-[9px] uppercase tracking-wide text-amber-300">Inactive</span>
                                    )}
                                  </span>
                                  {selected && (
                                    <Check className="h-4 w-4 shrink-0 text-cyan-300" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="block rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] text-amber-300">
                            No active categories are available. Create or activate a category first.
                          </span>
                        )}

                        {form.categoryIds.length === 0 && (
                          <span className="block text-[10px] text-amber-300">
                            Select at least one category before saving this product.
                          </span>
                        )}
                      </div>
                    </div>
                  </Section>

                  {/* CONTENT */}
                  <Section
                    id="content"
                    title="Content"
                    subtitle="Customer-facing copy and product description."
                    open={
                      activeTab === "content" ||
                      sections.content
                    }
                    onToggle={() =>
                      toggleSection("content")
                    }
                  >
                    <div className="space-y-4">
                      <Field
                        label="Headline"
                        value={form.headline}
                        onChange={(v) =>
                          update("headline", v)
                        }
                        placeholder="Engineered for modern vision."
                      />

                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                          Description{" "}
                          <span className="text-cyan-300">
                            *
                          </span>
                        </span>

                        <textarea
                          required
                          rows={5}
                          value={form.description}
                          onChange={(e) =>
                            update(
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Describe the product, frame, lens, design and customer benefits..."
                          className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/70"
                        />
                      </label>
                    </div>
                  </Section>

                  {/* MEDIA */}
                  <Section
                    id="media"
                    title="Media"
                    subtitle="Product imagery and video attachment layer."
                    open={
                      activeTab === "media" ||
                      sections.media
                    }
                    onToggle={() =>
                      toggleSection("media")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-dashed border-[#28506f] bg-[#081522] p-5">
                        <ImagePlus className="h-6 w-6 text-cyan-300" />

                        <p className="mt-3 text-sm font-semibold text-white">
                          Product images
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Multiple product images,
                          ordering and primary-image
                          support are designed to be
                          handled through the product
                          media layer.
                        </p>

                        <div className="mt-4 rounded-xl border border-[#1d3b56] bg-[#06111e] px-3 py-2 text-[10px] text-slate-500">
                          Image upload endpoint can be
                          connected without changing the
                          product catalog contract.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-[#28506f] bg-[#081522] p-5">
                        <Video className="h-6 w-6 text-cyan-300" />

                        <p className="mt-3 text-sm font-semibold text-white">
                          Product video
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Product videos can later be
                          stored as background,
                          autoplay, muted and looped
                          media on the storefront.
                        </p>

                        <div className="mt-4 rounded-xl border border-[#1d3b56] bg-[#06111e] px-3 py-2 text-[10px] text-slate-500">
                          Storage provider integration
                          remains separate from product
                          pricing and catalog data.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-400/10 bg-blue-400/5 p-3 text-[11px] leading-5 text-blue-100/80">
                      Media is intentionally kept
                      separate from the core product
                      record. This prevents external
                      storage URLs from becoming the
                      product identity itself.
                    </div>
                  </Section>

                  {/* PRICING */}
                  <Section
                    id="pricing"
                    title="Pricing & Discount"
                    subtitle="All catalog prices are stored and displayed as Indian Rupees (INR)."
                    open={
                      activeTab === "pricing" ||
                      sections.pricing
                    }
                    onToggle={() =>
                      toggleSection("pricing")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Original price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={form.basePrice}
                        onChange={(v) =>
                          update(
                            "basePrice",
                            v
                          )
                        }
                        placeholder="10000"
                      />

                      <Field
                        label="Discount %"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={
                          form.discountPercent
                        }
                        onChange={(v) =>
                          update(
                            "discountPercent",
                            v
                          )
                        }
                        placeholder="20"
                      />

                      <Field
                        label="Compare-at price (₹)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={
                          form.comparePrice
                        }
                        onChange={(v) =>
                          update(
                            "comparePrice",
                            v
                          )
                        }
                        placeholder="12000"
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-cyan-300">
                            Live INR calculation
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Original price stays as
                            the source price. The
                            discounted selling price is
                            calculated automatically.
                          </p>
                        </div>

                        <div className="text-left lg:text-right">
                          {discountPercent > 0 &&
                            originalPrice > 0 && (
                              <p className="text-sm text-slate-500 line-through">
                                {formatINR(
                                  originalPrice
                                )}
                              </p>
                            )}

                          <p className="text-2xl font-bold text-white">
                            {formatINR(
                              discountedPrice
                            )}
                          </p>

                          {discountPercent > 0 && (
                            <p className="mt-1 text-[10px] font-semibold text-cyan-300">
                              Saving{" "}
                              {formatINR(
                                discountAmount
                              )}{" "}
                              · {discountPercent}% OFF
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#203a56] bg-[#081321] p-3 text-[10px] text-slate-500">
                      Currency is fixed to INR for
                      the Indian storefront. Payment
                      gateway currency conversion should
                      be handled separately by the
                      payment API.
                    </div>
                  </Section>

                  {/* SPECIFICATIONS */}
                  <Section
                    id="specs"
                    title="Specifications"
                    subtitle="Frame, lens, dimensions and structured product metadata."
                    open={
                      activeTab === "specs" ||
                      sections.specs
                    }
                    onToggle={() =>
                      toggleSection("specs")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Frame shape"
                        value={form.frameShape}
                        onChange={(v) =>
                          update(
                            "frameShape",
                            v
                          )
                        }
                      />

                      <Field
                        label="Frame material"
                        value={
                          form.frameMaterial
                        }
                        onChange={(v) =>
                          update(
                            "frameMaterial",
                            v
                          )
                        }
                      />

                      <Field
                        label="Lens material"
                        value={
                          form.lensMaterial
                        }
                        onChange={(v) =>
                          update(
                            "lensMaterial",
                            v
                          )
                        }
                      />

                      <Field
                        label="GSM"
                        type="number"
                        min="0"
                        value={form.gsm}
                        onChange={(v) =>
                          update("gsm", v)
                        }
                      />

                      <Field
                        label="Lens width (mm)"
                        type="number"
                        min="0"
                        value={
                          form.lensWidthMm
                        }
                        onChange={(v) =>
                          update(
                            "lensWidthMm",
                            v
                          )
                        }
                      />

                      <Field
                        label="Bridge width (mm)"
                        type="number"
                        min="0"
                        value={
                          form.bridgeWidthMm
                        }
                        onChange={(v) =>
                          update(
                            "bridgeWidthMm",
                            v
                          )
                        }
                      />

                      <Field
                        label="Temple length (mm)"
                        type="number"
                        min="0"
                        value={
                          form.templeLengthMm
                        }
                        onChange={(v) =>
                          update(
                            "templeLengthMm",
                            v
                          )
                        }
                      />

                      <Field
                        label="Weight (g)"
                        type="number"
                        min="0"
                        value={
                          form.totalWeightG
                        }
                        onChange={(v) =>
                          update(
                            "totalWeightG",
                            v
                          )
                        }
                      />

                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                          Gender style
                        </span>

                        <select
                          value={
                            form.genderStyle
                          }
                          onChange={(e) =>
                            update(
                              "genderStyle",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/70"
                        >
                          <option value="Unisex">
                            Unisex
                          </option>

                          <option value="Men">
                            Men
                          </option>

                          <option value="Women">
                            Women
                          </option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                          Tags
                        </span>

                        <input
                          value={form.tags}
                          onChange={(e) =>
                            update(
                              "tags",
                              e.target.value
                            )
                          }
                          placeholder="premium, titanium, new"
                          className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/70"
                        />

                        <span className="block text-[10px] text-slate-600">
                          Separate tags using commas.
                        </span>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                          Specifications JSON
                        </span>

                        <textarea
                          value={
                            form.specifications
                          }
                          onChange={(e) =>
                            update(
                              "specifications",
                              e.target.value
                            )
                          }
                          rows={5}
                          placeholder='{"uvProtection":"UV400","polarized":true}'
                          className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 font-mono text-xs text-white outline-none focus:border-cyan-400/70"
                        />
                      </label>
                    </div>
                  </Section>

                  {/* GLASS */}
                  <Section
                    id="glass"
                    title="Glass Configuration"
                    subtitle="Choose which admin-managed glass options this product exposes."
                    open={
                      activeTab === "glass" ||
                      sections.glass
                    }
                    onToggle={() =>
                      toggleSection("glass")
                    }
                  >
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#203a56] bg-[#081321] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Global Glass Library
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Glass types are managed
                          globally and can then be
                          enabled per product.
                        </p>
                      </div>

                      <Link
                        href="/admin/glasses"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/15 hover:text-white"
                      >
                        Manage Glass Library
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    {metadataLoading ? (
                      <div className="rounded-2xl border border-[#203a56] bg-[#081321] p-6 text-center text-xs text-slate-500">
                        <RefreshCw className="mx-auto mb-2 h-4 w-4 animate-spin" />
                        Loading glass library…
                      </div>
                    ) : activeGlasses.length ===
                      0 ? (
                      <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-5">
                        <p className="text-sm font-semibold text-amber-100">
                          No active glass options
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-100/60">
                          Add a glass option from the
                          Glass Library first. After
                          creating it, return here and
                          select it for this product.
                        </p>

                        <Link
                          href="/admin/glasses"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/15"
                        >
                          Open Glass Library
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">
                            Available glass options
                          </span>

                          <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[9px] font-semibold text-cyan-300">
                            {
                              form.glassOptionIds
                                .length
                            }{" "}
                            selected
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {activeGlasses.map(
                            (glass) => {
                              const selected =
                                form.glassOptionIds.includes(
                                  glass.id
                                );

                              return (
                                <button
                                  key={
                                    glass.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    toggleGlass(
                                      glass.id
                                    )
                                  }
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    selected
                                      ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_10px_35px_rgba(34,211,238,.06)]"
                                      : "border-[#203a56] bg-[#081321] hover:border-[#315a7d]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-white">
                                      {
                                        glass.name
                                      }
                                    </span>

                                    <span
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                        selected
                                          ? "border-cyan-300 bg-cyan-300 text-[#04101b]"
                                          : "border-slate-600"
                                      }`}
                                    >
                                      {selected && (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-[11px] text-slate-500">
                                    {glass.material ||
                                      glass.description ||
                                      "Admin-managed glass option"}
                                  </p>

                                  {glass.priceAdjustment !==
                                    0 && (
                                    <p className="mt-2 font-mono text-[10px] text-cyan-300">
                                      {glass.priceAdjustment >
                                      0
                                        ? "+"
                                        : ""}
                                      {formatINR(
                                        glass.priceAdjustment
                                      )}
                                    </p>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </>
                    )}
                  </Section>

                  {/* INVENTORY */}
                  <Section
                    id="stock"
                    title="Inventory"
                    subtitle="Initial stock and automatic low-stock threshold."
                    open={
                      activeTab === "stock" ||
                      sections.stock
                    }
                    onToggle={() =>
                      toggleSection("stock")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Initial stock"
                        type="number"
                        min="0"
                        required
                        value={form.stock}
                        onChange={(v) =>
                          update("stock", v)
                        }
                      />

                      <Field
                        label="Low-stock threshold"
                        type="number"
                        min="0"
                        value={
                          form.lowStockThreshold
                        }
                        onChange={(v) =>
                          update(
                            "lowStockThreshold",
                            v
                          )
                        }
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-[#203a56] bg-[#081321] p-4">
                      <p className="text-[10px] uppercase tracking-widest text-cyan-300">
                        Inventory logic
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Available, reserved and sold
                        counters are maintained by the
                        inventory/order lifecycle. A
                        successful purchase can decrease
                        available stock and the product
                        automatically becomes out of stock
                        at zero.
                      </p>
                    </div>
                  </Section>

                  {/* PUBLISHING */}
                  <Section
                    id="publishing"
                    title="Publishing"
                    subtitle="Draft/publish state and release scheduling."
                    open={
                      activeTab === "publishing" ||
                      sections.publishing
                    }
                    onToggle={() =>
                      toggleSection("publishing")
                    }
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Release date"
                        type="datetime-local"
                        value={
                          form.releaseDate
                        }
                        onChange={(v) =>
                          update(
                            "releaseDate",
                            v
                          )
                        }
                      />

                      <Field
                        label="Publish date"
                        type="datetime-local"
                        value={
                          form.publishedAt
                        }
                        onChange={(v) =>
                          update(
                            "publishedAt",
                            v
                          )
                        }
                      />
                    </div>

                    <label className="mt-4 flex items-center gap-3 rounded-xl border border-[#203a56] bg-[#081321] p-3">
                      <input
                        type="checkbox"
                        checked={
                          form.isPublished
                        }
                        onChange={(e) =>
                          update(
                            "isPublished",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 accent-cyan-400"
                      />

                      <span>
                        <span className="block text-sm font-medium text-white">
                          Publish to storefront
                        </span>

                        <span className="block text-[11px] text-slate-500">
                          Leave disabled to save as
                          draft.
                        </span>
                      </span>
                    </label>
                  </Section>

                  {/* SEO */}
                  <Section
                    id="seo"
                    title="SEO"
                    subtitle="Search metadata for the product page."
                    open={
                      activeTab === "seo" ||
                      sections.seo
                    }
                    onToggle={() =>
                      toggleSection("seo")
                    }
                  >
                    <div className="space-y-4">
                      <Field
                        label="SEO title"
                        value={form.seoTitle}
                        onChange={(v) =>
                          update(
                            "seoTitle",
                            v
                          )
                        }
                      />

                      <label className="block space-y-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">
                          SEO description
                        </span>

                        <textarea
                          rows={4}
                          value={
                            form.seoDescription
                          }
                          onChange={(e) =>
                            update(
                              "seoDescription",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[#203a56] bg-[#081321] px-3.5 py-3 text-sm text-white outline-none focus:border-cyan-400/70"
                        />
                      </label>
                    </div>
                  </Section>
                </div>

                {/* FOOTER */}
                <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#162d44] bg-[#050d17]/95 py-4 backdrop-blur">
                  <p className="max-w-xl text-[11px] text-slate-500">
                    All product prices use INR (₹).
                    Destructive actions require
                    confirmation. Product media storage
                    remains separate from catalog data.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModalOpen(false)
                      }
                      className="rounded-xl border border-[#203a56] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-[#0a1726] hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      disabled={saving}
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-[#04101b] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}

                      {saving
                        ? editingProductId ? "Updating…" : "Creating…"
                        : editingProductId
                          ? "Save Changes"
                          : form.isPublished
                            ? "Create & Publish"
                            : "Save Draft"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}