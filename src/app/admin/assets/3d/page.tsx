"use client";

import { FormEvent, useEffect, useState } from "react";
import { Archive, Box, Download, Loader2, Plus, Upload } from "lucide-react";

type ProductOption = { id: string; name: string; sku: string };
type ModelAsset = {
  id: string;
  productId: string;
  name: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  modelSize: number;
  sourceSize: number | null;
  triangleCount: number | null;
  textureCount: number;
  createdAt: string;
  updatedAt: string;
  product: { name: string; sku: string };
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const loadAssets = async () => {
    const response = await fetch("/api/admin/assets/3d");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load 3D assets");
    setAssets(data.assets);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/assets/3d").then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load 3D assets");
        setAssets(data.assets);
      }),
      fetch("/api/admin/products").then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load products");
        const options = data.products.map((product: ProductOption) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
        }));
        setProducts(options);
        setProductId(options[0]?.id || "");
      }),
    ])
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load asset manager"))
      .finally(() => setLoading(false));
  }, []);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!model || !productId) {
      setMessage("Select a product and a GLB model before uploading.");
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("productId", productId);
      body.set("name", name);
      body.set("model", model);
      if (source) body.set("source", source);
      const response = await fetch("/api/admin/assets/3d", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "3D model upload failed");
      setAssets((current) => [data.asset, ...current]);
      setName("");
      setModel(null);
      setSource(null);
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "3D model upload failed");
    } finally {
      setWorking(false);
    }
  };

  const updateStatus = async (asset: ModelAsset, status: ModelAsset["status"]) => {
    setWorking(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/assets/3d/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update asset status");
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update asset status");
    } finally {
      setWorking(false);
    }
  };

  const downloadSource = async (asset: ModelAsset) => {
    try {
      const response = await fetch(`/api/admin/assets/3d/${asset.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to access Blender source");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to access Blender source");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-purple-400">Asset management</p>
          <h1 className="mt-2 text-2xl font-bold text-white">3D product assets</h1>
          <p className="mt-1 text-sm text-gray-400">Upload a validated GLB and optionally keep the private Blender master with the asset version.</p>
        </div>
        <button onClick={() => setOpen(true)} disabled={products.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Upload model
        </button>
      </header>

      {message && <p role="status" className="text-sm text-rose-400">{message}</p>}
      <div className="overflow-hidden rounded-2xl border border-[#1c202c] bg-[#0f121b]">
        {loading ? <p className="p-8 text-center text-sm text-gray-400">Loading assets…</p> : assets.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400"><Box className="mx-auto mb-3 h-8 w-8 opacity-60" />No 3D assets uploaded yet.</div>
        ) : (
          <div className="divide-y divide-[#1c202c]">
            {assets.map((asset) => (
              <article key={asset.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#282d3a] bg-[#151925] text-purple-300"><Box className="h-5 w-5" /></div>
                <div className="min-w-48 flex-1">
                  <h2 className="font-semibold text-white">{asset.name} <span className="font-mono text-xs text-purple-300">v{asset.version}</span></h2>
                  <p className="mt-1 text-xs text-gray-400">{asset.product.name} · {asset.product.sku}</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    GLB {formatBytes(asset.modelSize)} · {asset.triangleCount === null ? "Triangles not reported" : `${asset.triangleCount.toLocaleString()} triangles`} · {asset.textureCount} textures
                    {asset.sourceSize ? ` · Private .blend ${formatBytes(asset.sourceSize)}` : ""}
                  </p>
                  {(asset.modelSize > 8 * 1024 * 1024 || (asset.triangleCount || 0) > 100000) && (
                    <p className="mt-1 text-[11px] text-amber-300">
                      Performance warning: {asset.modelSize > 8 * 1024 * 1024 ? "large download" : ""}
                      {asset.modelSize > 8 * 1024 * 1024 && (asset.triangleCount || 0) > 100000 ? " · " : ""}
                      {(asset.triangleCount || 0) > 100000 ? "high polygon count" : ""}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${asset.status === "PUBLISHED" ? "bg-emerald-950 text-emerald-300" : asset.status === "ARCHIVED" ? "bg-gray-800 text-gray-400" : "bg-amber-950 text-amber-300"}`}>{asset.status}</span>
                {asset.sourceSize !== null && <button onClick={() => downloadSource(asset)} className="rounded-lg p-2 text-gray-400 hover:text-white" title="Download private Blender source"><Download className="h-4 w-4" /></button>}
                {asset.status === "DRAFT" && <button disabled={working} onClick={() => updateStatus(asset, "PUBLISHED")} className="rounded-lg bg-emerald-950 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-900 disabled:opacity-50">Publish</button>}
                {asset.status === "PUBLISHED" && <button disabled={working} onClick={() => updateStatus(asset, "DRAFT")} className="rounded-lg border border-[#34394a] px-3 py-2 text-xs text-gray-300 hover:text-white disabled:opacity-50">Unpublish</button>}
                {asset.status !== "ARCHIVED" && <button disabled={working} onClick={() => updateStatus(asset, "ARCHIVED")} className="rounded-lg p-2 text-gray-500 hover:text-rose-300 disabled:opacity-50" title="Archive asset"><Archive className="h-4 w-4" /></button>}
              </article>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form onSubmit={upload} className="w-full max-w-xl space-y-4 rounded-2xl border border-[#252a37] bg-[#0c0f16] p-6">
            <div><h2 className="text-lg font-bold text-white">Upload Blender export</h2><p className="mt-1 text-xs text-gray-400">GLB is validated and stored privately until you publish it. Blender source remains private.</p></div>
            <label className="block space-y-1 text-xs text-gray-400">Product<select required className="w-full rounded-lg border border-[#252a37] bg-[#10131c] px-3 py-2 text-sm text-white" value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>
            <label className="block space-y-1 text-xs text-gray-400">Asset name<input required maxLength={120} className="w-full rounded-lg border border-[#252a37] bg-[#10131c] px-3 py-2 text-sm text-white" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Chronos Alpha studio model" /></label>
            <label className="block space-y-1 text-xs text-gray-400">Web model (.glb, max 20 MB)<input required accept=".glb,model/gltf-binary" type="file" onChange={(event) => setModel(event.target.files?.[0] || null)} className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#202536] file:px-3 file:py-2 file:text-xs file:text-white" /></label>
            <label className="block space-y-1 text-xs text-gray-400">Blender master (.blend, optional, max 50 MB)<input accept=".blend,application/octet-stream" type="file" onChange={(event) => setSource(event.target.files?.[0] || null)} className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#202536] file:px-3 file:py-2 file:text-xs file:text-white" /></label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#252a37] px-4 py-2 text-sm text-gray-300">Cancel</button>
              <button disabled={working} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload draft</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
