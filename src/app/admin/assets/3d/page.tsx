"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Box,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileBox,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

type AssetStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type ModelAsset = {
  id: string;
  productId: string;
  name: string;
  version: number;
  status: AssetStatus;
  modelSize: number;
  sourceSize: number | null;
  triangleCount: number | null;
  textureCount: number;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    sku: string;
  };
};

type AssetPreview = {
  id: string;
  name: string;
  url: string;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusClass(status: AssetStatus) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60";

    case "ARCHIVED":
      return "bg-gray-800/70 text-gray-400 border border-gray-700";

    default:
      return "bg-amber-950/70 text-amber-300 border border-amber-800/60";
  }
}

export default function ModelAssetsPage() {
  const [assets, setAssets] = useState<ModelAsset[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");

  const [model, setModel] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [preview, setPreview] = useState<AssetPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AssetStatus>(
    "ALL"
  );

  const loadAssets = async () => {
    const response = await fetch("/api/admin/assets/3d", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load 3D assets");
    }

    setAssets(data.assets || []);
  };

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products", {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load products");
    }

    const options: ProductOption[] = (data.products || []).map(
      (product: ProductOption) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
      })
    );

    setProducts(options);

    setProductId((current) => {
      if (current && options.some((product) => product.id === current)) {
        return current;
      }

      return options[0]?.id || "";
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setMessage("");

    try {
      await Promise.all([loadAssets(), loadProducts()]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load 3D asset manager"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesStatus =
        statusFilter === "ALL" || asset.status === statusFilter;

      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      return (
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.product.name.toLowerCase().includes(normalizedSearch) ||
        asset.product.sku.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [assets, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: assets.length,
      published: assets.filter((asset) => asset.status === "PUBLISHED")
        .length,
      draft: assets.filter((asset) => asset.status === "DRAFT").length,
      archived: assets.filter((asset) => asset.status === "ARCHIVED").length,
    };
  }, [assets]);

  const resetUploadForm = () => {
    setName("");
    setModel(null);
    setSource(null);
    setProductId(products[0]?.id || "");
  };

  const closeUpload = () => {
    if (working) return;

    setOpen(false);
    resetUploadForm();
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setSuccessMessage("");

    if (!productId) {
      setMessage("Select a product before uploading.");
      return;
    }

    if (!name.trim()) {
      setMessage("Enter a name for this 3D asset.");
      return;
    }

    if (!model) {
      setMessage("Select a GLB model before uploading.");
      return;
    }

    if (!model.name.toLowerCase().endsWith(".glb")) {
      setMessage("The web model must be a .glb file.");
      return;
    }

    if (model.size > 20 * 1024 * 1024) {
      setMessage("The GLB file cannot be larger than 20 MB.");
      return;
    }

    if (source) {
      if (!source.name.toLowerCase().endsWith(".blend")) {
        setMessage("The Blender source must be a .blend file.");
        return;
      }

      if (source.size > 50 * 1024 * 1024) {
        setMessage("The Blender source cannot be larger than 50 MB.");
        return;
      }
    }

    setWorking(true);

    try {
      const body = new FormData();

      body.set("productId", productId);
      body.set("name", name.trim());
      body.set("model", model);

      if (source) {
        body.set("source", source);
      }

      const response = await fetch("/api/admin/assets/3d", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "3D model upload failed");
      }

      if (data.asset) {
        setAssets((current) => [data.asset, ...current]);
      } else {
        await loadAssets();
      }

      setSuccessMessage(
        "3D asset uploaded successfully as a draft."
      );

      setMessage("");
      setOpen(false);
      resetUploadForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "3D model upload failed"
      );
    } finally {
      setWorking(false);
    }
  };

  const updateStatus = async (
    asset: ModelAsset,
    status: AssetStatus
  ) => {
    setWorking(true);
    setMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/assets/3d/${asset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update asset status"
        );
      }

      await loadAssets();

      setSuccessMessage(
        `${asset.name} is now ${status.toLowerCase()}.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update asset status"
      );
    } finally {
      setWorking(false);
    }
  };

  const downloadSource = async (asset: ModelAsset) => {
    setMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/assets/3d/${asset.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to access Blender source"
        );
      }

      if (!data.url) {
        throw new Error("No download URL was returned.");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to access Blender source"
      );
    }
  };

  const openPreview = async (asset: ModelAsset) => {
    setPreviewLoading(true);
    setMessage("");

    try {
      /*
       * The asset API is expected to return a signed/private URL.
       * We intentionally do not expose modelKey from the database
       * directly to the browser.
       */
      const response = await fetch(
        `/api/admin/assets/3d/${asset.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load 3D model"
        );
      }

      if (!data.url) {
        throw new Error(
          "This asset does not currently expose a preview URL."
        );
      }

      setPreview({
        id: asset.id,
        name: asset.name,
        url: data.url,
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load 3D model preview"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-purple-400">
            Asset Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-white">
            3D Product Assets
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Manage validated GLB models, Blender masters and
            publishable 3D product assets for the EYECAP
            storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading || working}
            className="inline-flex items-center gap-2 rounded-xl border border-[#292e3d] bg-[#11151f] px-3 py-2.5 text-sm text-gray-300 transition hover:bg-[#181d29] hover:text-white disabled:opacity-50"
            title="Refresh assets"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={products.length === 0 || working}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Upload Model
          </button>
        </div>
      </header>

      {/* Messages */}
      {message && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300"
        >
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#1c202c] bg-[#0f121b] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/30 bg-[#0f121b] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Published
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {stats.published}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/30 bg-[#0f121b] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Draft
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {stats.draft}
          </p>
        </div>

        <div className="rounded-2xl border border-[#1c202c] bg-[#0f121b] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Archived
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-400">
            {stats.archived}
          </p>
        </div>
      </section>

      {/* Search / Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-[#1c202c] bg-[#0f121b] p-4 md:flex-row md:items-center">
        <div className="flex-1">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search asset, product or SKU..."
            className="w-full rounded-xl border border-[#292e3d] bg-[#0b0e15] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as "ALL" | AssetStatus
            )
          }
          className="rounded-xl border border-[#292e3d] bg-[#0b0e15] px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-purple-600"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </section>

      {/* Asset List */}
      <div className="overflow-hidden rounded-2xl border border-[#1c202c] bg-[#0f121b]">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              Loading 3D assets...
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            <Box className="mx-auto mb-4 h-10 w-10 opacity-40" />

            {assets.length === 0
              ? "No 3D assets uploaded yet."
              : "No assets match your current filters."}
          </div>
        ) : (
          <div className="divide-y divide-[#1c202c]">
            {filteredAssets.map((asset) => {
              const performanceWarning =
                asset.modelSize > 8 * 1024 * 1024 ||
                (asset.triangleCount || 0) > 100000;

              return (
                <article
                  key={asset.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-[#111520] lg:flex-row lg:items-center"
                >
                  {/* Icon */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-900/50 bg-purple-950/30 text-purple-300">
                    <FileBox className="h-6 w-6" />
                  </div>

                  {/* Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-white">
                        {asset.name}
                      </h2>

                      <span className="rounded-md border border-purple-900/50 bg-purple-950/30 px-2 py-0.5 font-mono text-[10px] text-purple-300">
                        v{asset.version}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                          asset.status
                        )}`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      {asset.product.name} · {asset.product.sku}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                      <span>
                        GLB {formatBytes(asset.modelSize)}
                      </span>

                      <span>
                        {asset.triangleCount === null
                          ? "Triangles not reported"
                          : `${asset.triangleCount.toLocaleString()} triangles`}
                      </span>

                      <span>
                        {asset.textureCount} textures
                      </span>

                      {asset.sourceSize !== null && (
                        <span>
                          Blender {formatBytes(asset.sourceSize)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Updated {formatDate(asset.updatedAt)}
                    </p>

                    {performanceWarning && (
                      <p className="mt-2 text-[11px] text-amber-300">
                        Performance warning:{" "}
                        {asset.modelSize > 8 * 1024 * 1024
                          ? "large download"
                          : ""}
                        {asset.modelSize > 8 * 1024 * 1024 &&
                        (asset.triangleCount || 0) > 100000
                          ? " · "
                          : ""}
                        {(asset.triangleCount || 0) > 100000
                          ? "high polygon count"
                          : ""}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      type="button"
                      disabled={previewLoading}
                      onClick={() => openPreview(asset)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#34394a] px-3 py-2 text-xs text-gray-300 transition hover:border-purple-700 hover:bg-purple-950/30 hover:text-white disabled:opacity-50"
                      title="Preview GLB"
                    >
                      {previewLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      Preview
                    </button>

                    <a
                      href={`/admin/graphics?asset=${encodeURIComponent(
                        asset.id
                      )}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#34394a] px-3 py-2 text-xs text-gray-300 transition hover:border-purple-700 hover:bg-purple-950/30 hover:text-white"
                      title="Open in 3D Studio"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Studio
                    </a>

                    {asset.sourceSize !== null && (
                      <button
                        type="button"
                        onClick={() => downloadSource(asset)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-[#1a1f2c] hover:text-white"
                        title="Download private Blender source"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {asset.status === "DRAFT" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateStatus(asset, "PUBLISHED")
                        }
                        className="rounded-lg bg-emerald-950 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900 disabled:opacity-50"
                      >
                        Publish
                      </button>
                    )}

                    {asset.status === "PUBLISHED" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateStatus(asset, "DRAFT")
                        }
                        className="rounded-lg border border-[#34394a] px-3 py-2 text-xs text-gray-300 transition hover:bg-[#181d29] hover:text-white disabled:opacity-50"
                      >
                        Unpublish
                      </button>
                    )}

                    {asset.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          updateStatus(asset, "ARCHIVED")
                        }
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-rose-950/20 hover:text-rose-300 disabled:opacity-50"
                        title="Archive asset"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={upload}
            className="w-full max-w-xl space-y-5 rounded-2xl border border-[#252a37] bg-[#0c0f16] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                  3D Asset Pipeline
                </p>

                <h2 className="mt-1 text-lg font-bold text-white">
                  Upload Blender Export
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Upload a validated GLB for the web viewer.
                  Blender source is optional and remains private.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUpload}
                disabled={working}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-[#181d29] hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Product */}
            <label className="block space-y-1.5 text-xs text-gray-400">
              <span>
                Product <span className="text-rose-400">*</span>
              </span>

              <select
                required
                className="w-full rounded-xl border border-[#252a37] bg-[#10131c] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-600"
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
              >
                <option value="" disabled>
                  Select product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </label>

            {/* Name */}
            <label className="block space-y-1.5 text-xs text-gray-400">
              <span>
                Asset name{" "}
                <span className="text-rose-400">*</span>
              </span>

              <input
                required
                maxLength={120}
                className="w-full rounded-xl border border-[#252a37] bg-[#10131c] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-600"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Chronos Alpha Studio Model"
              />
            </label>

            {/* GLB */}
            <label className="block space-y-1.5 text-xs text-gray-400">
              <span>
                Web model{" "}
                <span className="text-gray-600">
                  (.glb · max 20 MB)
                </span>
              </span>

              <input
                required
                accept=".glb,model/gltf-binary"
                type="file"
                onChange={(event) =>
                  setModel(
                    event.target.files?.[0] || null
                  )
                }
                className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#202536] file:px-3 file:py-2 file:text-xs file:text-white hover:file:bg-[#2a3042]"
              />

              {model && (
                <p className="flex items-center gap-2 text-[11px] text-purple-300">
                  <Box className="h-3.5 w-3.5" />
                  {model.name} · {formatBytes(model.size)}
                </p>
              )}
            </label>

            {/* Blender */}
            <label className="block space-y-1.5 text-xs text-gray-400">
              <span>
                Blender master{" "}
                <span className="text-gray-600">
                  (.blend · optional · max 50 MB)
                </span>
              </span>

              <input
                accept=".blend,application/octet-stream"
                type="file"
                onChange={(event) =>
                  setSource(
                    event.target.files?.[0] || null
                  )
                }
                className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#202536] file:px-3 file:py-2 file:text-xs file:text-white hover:file:bg-[#2a3042]"
              />

              {source && (
                <p className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Download className="h-3.5 w-3.5" />
                  {source.name} · {formatBytes(source.size)}
                </p>
              )}
            </label>

            {/* Info */}
            <div className="rounded-xl border border-purple-900/30 bg-purple-950/10 p-3 text-[11px] leading-relaxed text-gray-400">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />

                <p>
                  The GLB will be validated by the server and
                  stored as a{" "}
                  <span className="font-semibold text-amber-300">
                    DRAFT
                  </span>
                  . It will not become storefront-visible
                  until you publish the asset.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeUpload}
                disabled={working}
                className="rounded-xl border border-[#252a37] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#181d29] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  working ||
                  !productId ||
                  !name.trim() ||
                  !model
                }
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {working
                  ? "Uploading..."
                  : "Upload Draft"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="flex h-[min(850px,92vh)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#292e3d] bg-[#090b10] shadow-2xl">
            {/* Preview Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#1c202c] bg-[#0c0f16] px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                  GLB Preview
                </p>

                <h2 className="mt-1 truncate text-sm font-semibold text-white">
                  {preview.name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#34394a] px-3 py-2 text-xs text-gray-300 transition hover:bg-[#181d29] hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open GLB
                </a>

                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-[#181d29] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Native GLB preview fallback */}
            <div className="relative flex-1 bg-[#050609]">
              <model-viewer
                src={preview.url}
                alt={preview.name}
                camera-controls
                auto-rotate
                shadow-intensity="1"
                exposure="1"
                environment-image="neutral"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "#050609",
                }}
              />

              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[#292e3d] bg-black/70 px-4 py-2 text-[10px] text-gray-400 backdrop-blur-md">
                Drag to rotate · Scroll to zoom
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}