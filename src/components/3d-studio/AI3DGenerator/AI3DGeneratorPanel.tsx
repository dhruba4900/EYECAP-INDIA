"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { EngineContext } from "@/engine/3d/core/EngineContext";

type GenerationStatus = "idle" | "generating" | "success" | "error";

interface InputImage {
  id: string;
  file: File;
  url: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface HistoryItem {
  id: string;
  createdAt: number;
  imageCount: number;
  primaryIndex: number;
  blob: Blob;
  fileName: string;
}

interface Props {
  engineRef: React.MutableRefObject<EngineContext | null>;
  compact?: boolean;
}

const MAX_IMAGES = 12;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function AI3DGeneratorPanel({
  engineRef,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [images, setImages] = useState<InputImage[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);

  const [status, setStatus] =
    useState<GenerationStatus>("idle");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [modelBlob, setModelBlob] =
    useState<Blob | null>(null);

  const [modelUrl, setModelUrl] =
    useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [assetName, setAssetName] =
    useState("AI Generated 3D Model");

  const [uploadingAsset, setUploadingAsset] =
    useState(false);

  const totalSize = useMemo(
    () =>
      images.reduce(
        (sum, image) => sum + image.file.size,
        0
      ),
    [images]
  );

  useEffect(() => {
    return () => {
      images.forEach((image) =>
        URL.revokeObjectURL(image.url)
      );

      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }

      history.forEach((item) =>
        URL.revokeObjectURL(
          URL.createObjectURL(item.blob)
        )
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/products")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return Array.isArray(data.products)
          ? data.products
          : [];
      })
      .then((items) => {
        if (!cancelled && items) {
          setProducts(items);
          if (items[0]?.id) {
            setSelectedProduct(items[0].id);
          }
        }
      })
      .catch(() => {
        // Product publishing is optional; generation still works.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addFiles = (files: FileList | File[]) => {
    setError(null);

    const incoming = Array.from(files);
    const valid: InputImage[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than 25 MB.`);
        continue;
      }

      valid.push({
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    setImages((current) => {
      const next = [...current, ...valid].slice(
        0,
        MAX_IMAGES
      );

      if (
        primaryIndex >= next.length &&
        next.length > 0
      ) {
        setPrimaryIndex(0);
      }

      return next;
    });
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const index = current.findIndex(
        (image) => image.id === id
      );

      if (index < 0) return current;

      URL.revokeObjectURL(current[index].url);

      const next = current.filter(
        (image) => image.id !== id
      );

      setPrimaryIndex((currentPrimary) => {
        if (next.length === 0) return 0;
        if (index === currentPrimary) return 0;
        if (index < currentPrimary)
          return currentPrimary - 1;
        return currentPrimary;
      });

      return next;
    });
  };

  const clearImages = () => {
    images.forEach((image) =>
      URL.revokeObjectURL(image.url)
    );

    setImages([]);
    setPrimaryIndex(0);
    setError(null);
  };

  const generate = async () => {
    if (!images.length) {
      setError("Add at least one product image.");
      return;
    }

    if (!engineRef.current) {
      setError("3D engine is not ready yet.");
      return;
    }

    setStatus("generating");
    setError(null);
    setMessage("Preparing images…");

    try {
      const form = new FormData();

      images.forEach((image) => {
        form.append("images", image.file);
      });

      form.set(
        "primaryIndex",
        String(primaryIndex)
      );

      setMessage(
        "Running Stable Fast 3D. This can take several minutes…"
      );

      const response = await fetch(
        "/api/3d/generate",
        {
          method: "POST",
          body: form,
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        const details =
          data?.details ||
          data?.error ||
          `Generation failed (${response.status}).`;

        throw new Error(details);
      }

      const blob = await response.blob();

      if (
        !blob.size ||
        !blob.type.includes("gltf")
      ) {
        throw new Error(
          "The generator returned an invalid GLB response."
        );
      }

      const nextUrl = URL.createObjectURL(blob);

      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }

      const id =
        response.headers.get(
          "X-Eyecap-Job-Id"
        ) || `model-${Date.now()}`;

      setModelBlob(blob);
      setModelUrl(nextUrl);
      setJobId(id);

      setHistory((current) => [
        {
          id,
          createdAt: Date.now(),
          imageCount: images.length,
          primaryIndex,
          blob,
          fileName: `${id}.glb`,
        },
        ...current,
      ].slice(0, 5));

      setMessage("GLB generated. Loading into Studio…");

      await engineRef.current.importGLB(
        blob,
        {
          name: "AI_Generated_Eyewear",
          center: true,
          fitCamera: true,
        }
      );

      setStatus("success");
      setMessage(
        "Model generated and loaded into the 3D Studio."
      );
    } catch (generationError) {
      console.error(
        "[EYECAP 3D] Generation error:",
        generationError
      );

      setStatus("error");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "3D generation failed."
      );
      setMessage("");
    }
  };

  const downloadModel = () => {
    if (!modelBlob) return;

    const url = URL.createObjectURL(modelBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${jobId || "eyecap-model"}.glb`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  };

  const reloadModel = async () => {
    if (!modelBlob || !engineRef.current) return;

    try {
      setError(null);

      await engineRef.current.importGLB(
        modelBlob,
        {
          name: "AI_Generated_Eyewear",
          center: true,
          fitCamera: true,
        }
      );

      setMessage("Model reloaded into Studio.");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to reload GLB."
      );
    }
  };

  const publishToAdmin = async () => {
    if (!modelBlob) {
      setError("Generate a GLB before publishing.");
      return;
    }

    if (!selectedProduct) {
      setError("Select a product first.");
      return;
    }

    setUploadingAsset(true);
    setError(null);

    try {
      const modelFile = new File(
        [modelBlob],
        `${jobId || "eyecap-model"}.glb`,
        {
          type: "model/gltf-binary",
        }
      );

      const form = new FormData();

      form.set("productId", selectedProduct);
      form.set("name", assetName);
      form.set("model", modelFile);
      form.set(
        "source",
        `AI generated — job ${jobId || "unknown"}`
      );

      const response = await fetch(
        "/api/admin/assets/3d",
        {
          method: "POST",
          body: form,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to publish the 3D asset."
        );
      }

      setMessage(
        "3D model published to the selected product."
      );
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "3D asset publishing failed."
      );
    } finally {
      setUploadingAsset(false);
    }
  };

  return (
    <section
      className={[
        "rounded-2xl border border-neutral-800",
        "bg-neutral-950/95 text-white shadow-2xl",
        "backdrop-blur-xl",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <div className="text-xs font-bold tracking-wide">
              AI 3D GENERATOR
            </div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">
              Image → GLB → Studio
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <button
            type="button"
            onClick={clearImages}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
            title="Clear images"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) {
            addFiles(event.target.files);
          }
          event.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "generating"}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/70 px-3 py-3 text-xs font-semibold text-neutral-300 transition hover:border-purple-500 hover:text-white disabled:opacity-50"
      >
        <ImagePlus className="h-4 w-4" />
        Add Photos
      </button>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={[
                "relative overflow-hidden rounded-xl border",
                index === primaryIndex
                  ? "border-purple-500 ring-1 ring-purple-500/50"
                  : "border-neutral-800",
              ].join(" ")}
            >
              <img
                src={image.url}
                alt={image.file.name}
                className="aspect-square w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute right-1 top-1 rounded-md bg-black/75 p-1 text-white"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPrimaryIndex(index)
                }
                className={[
                  "absolute bottom-1 left-1 rounded-md px-1.5 py-1 text-[9px] font-bold",
                  index === primaryIndex
                    ? "bg-purple-600 text-white"
                    : "bg-black/75 text-neutral-300",
                ].join(" ")}
              >
                {index === primaryIndex
                  ? "PRIMARY"
                  : `VIEW ${index + 1}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-2 text-[9px] text-neutral-500">
          {images.length}/{MAX_IMAGES} photos ·{" "}
          {(totalSize / (1024 * 1024)).toFixed(1)} MB
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={
          !images.length ||
          status === "generating"
        }
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-purple-900/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "generating" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            GENERATING 3D MODEL…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {modelBlob
              ? "REDEFINE / REGENERATE MODEL"
              : "GENERATE 3D MODEL"}
          </>
        )}
      </button>

      {status === "generating" && (
        <div className="mt-3 rounded-xl border border-purple-900/50 bg-purple-950/20 p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-purple-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            AI reconstruction running
          </div>

          <div className="mt-1 text-[9px] leading-relaxed text-neutral-500">
            Stable Fast 3D is processing the primary image.
            Keep this tab open until the GLB is returned.
          </div>
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-2.5 text-[10px] text-emerald-300">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {message}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-900/60 bg-red-950/25 p-3">
          <div className="text-[10px] font-bold text-red-400">
            GENERATION ERROR
          </div>
          <div className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-[9px] leading-relaxed text-red-300/80">
            {error}
          </div>
        </div>
      )}

      {modelBlob && status !== "generating" && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Generated Model
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reloadModel}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-800 px-2 py-2 text-[10px] font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload
            </button>

            <button
              type="button"
              onClick={downloadModel}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-neutral-800 px-2 py-2 text-[10px] font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download GLB
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Publish to Product
            </div>

            <input
              value={assetName}
              onChange={(event) =>
                setAssetName(event.target.value)
              }
              className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-[10px] text-white outline-none focus:border-purple-500"
              placeholder="Asset name"
            />

            <select
              value={selectedProduct}
              onChange={(event) =>
                setSelectedProduct(event.target.value)
              }
              className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-[10px] text-white outline-none focus:border-purple-500"
            >
              <option value="">
                Select product
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                  {product.sku
                    ? ` — ${product.sku}`
                    : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={publishToAdmin}
              disabled={
                uploadingAsset ||
                !selectedProduct
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {uploadingAsset ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  PUBLISHING…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  PUBLISH TO PRODUCT
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-3">
          <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            Generation History
          </div>

          <div className="space-y-1.5">
            {history.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={async () => {
                  try {
                    await engineRef.current?.importGLB(
                      item.blob,
                      {
                        name: `AI_Generated_Version_${history.length - index}`,
                        center: true,
                        fitCamera: true,
                      }
                    );

                    setModelBlob(item.blob);
                    setMessage(
                      "Selected generation loaded into Studio."
                    );
                  } catch (loadError) {
                    setError(
                      loadError instanceof Error
                        ? loadError.message
                        : "Unable to load generation."
                    );
                  }
                }}
                className="flex w-full items-center justify-between rounded-lg bg-neutral-900 px-2.5 py-2 text-left hover:bg-neutral-800"
              >
                <span className="text-[9px] text-neutral-300">
                  V{history.length - index} ·{" "}
                  {item.imageCount} photos
                </span>
                <span className="text-[8px] text-neutral-600">
                  {new Date(
                    item.createdAt
                  ).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
