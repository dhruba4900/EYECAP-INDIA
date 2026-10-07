"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import * as THREE from "three";
import {
  AlertCircle,
  Eye,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
} from "lucide-react";

import { EngineContext } from "@/engine/3d/core/EngineContext";
import type { GraphicsConfig } from "@/lib/graphics";

interface EyewearViewerProps {
  modelType?: string;

  frameColor?: string;
  lensColor?: string;

  metalness?: number;
  roughness?: number;
  transmission?: number;

  posterUrl?: string;

  /**
   * Public GLB / GLTF URL.
   *
   * Example:
   * /models/eyewear/model.glb
   */
  modelUrl?: string | null;

  /**
   * Optional already-created engine.
   *
   * If supplied, this viewer does NOT create another
   * Three.js renderer.
   */
  engine?: EngineContext | null;

  /**
   * Optional callback when this component creates its own engine.
   */
  onEngineReady?: (engine: EngineContext) => void;

  autoRotate?: boolean;

  graphics?: GraphicsConfig;

  className?: string;

  allowZoom?: boolean;

  /**
   * Hide viewer HUD controls.
   */
  showControls?: boolean;

  /**
   * Enable fullscreen button.
   */
  allowFullscreen?: boolean;
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  });
}

function applyMaterials(
  root: THREE.Object3D,
  frameColor: string,
  lensColor: string,
  metalness: number,
  roughness: number,
  transmission: number,
): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const name = child.name.toLowerCase();

    const isLens =
      name.includes("lens") ||
      name.includes("glass") ||
      name.includes("crystal");

    if (isLens) {
      const material =
        child.material instanceof THREE.MeshPhysicalMaterial
          ? child.material
          : new THREE.MeshPhysicalMaterial();

      material.color.set(lensColor);
      material.transparent = true;
      material.opacity = 0.82;
      material.roughness = 0.05;
      material.metalness = 0.05;
      material.transmission = transmission;
      material.ior = 1.52;
      material.clearcoat = 1;
      material.clearcoatRoughness = 0.04;

      child.material = material;
    } else {
      const material =
        child.material instanceof THREE.MeshStandardMaterial
          ? child.material
          : new THREE.MeshStandardMaterial();

      material.color.set(frameColor);
      material.metalness = metalness;
      material.roughness = roughness;

      child.material = material;
    }

    child.castShadow = true;
    child.receiveShadow = true;
  });
}

export default function EyewearViewer({
  modelType = "geometric",

  frameColor = "#383B42",
  lensColor = "#0F172A",

  metalness = 0.9,
  roughness = 0.18,
  transmission = 0.65,

  posterUrl,
  modelUrl,

  engine: externalEngine = null,
  onEngineReady,

  autoRotate = true,

  graphics,

  className = "w-full h-[450px]",

  allowZoom = true,
  showControls = true,
  allowFullscreen = true,
}: EyewearViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const internalEngineRef = useRef<EngineContext | null>(null);

  const engine = externalEngine ?? internalEngineRef.current;

  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importedModelRef = useRef<THREE.Object3D | null>(null);

  /**
   * ---------------------------------------------------------
   * ENGINE INITIALIZATION
   * ---------------------------------------------------------
   *
   * Important:
   * This component creates ONE EngineContext only when an
   * external engine was not supplied.
   */
  useEffect(() => {
    if (externalEngine) {
      setEngineReady(true);
      setLoading(false);
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    let mounted = true;

    try {
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

      if (!gl) {
        setWebglSupported(false);
        setLoading(false);
        return;
      }

      const context = new EngineContext({
        canvas,
        antialias: true,
        alpha: true,
      });

      if (!mounted) {
        context.dispose();
        return;
      }

      internalEngineRef.current = context;

      context.start();

      setEngineReady(true);
      setLoading(false);

      onEngineReady?.(context);
    } catch (err) {
      console.error("EYECAP 3D Engine initialization failed:", err);

      if (mounted) {
        setWebglSupported(false);
        setLoading(false);
        setError("Unable to initialize the 3D graphics engine.");
      }
    }

    return () => {
      mounted = false;

      const currentEngine = internalEngineRef.current;

      if (currentEngine) {
        currentEngine.dispose();
        internalEngineRef.current = null;
      }

      setEngineReady(false);
    };
  }, [externalEngine, onEngineReady]);

  /**
   * ---------------------------------------------------------
   * RESIZE
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const resize = () => {
      const currentEngine =
        externalEngine ?? internalEngineRef.current;

      if (!currentEngine) return;

      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);

      currentEngine.resize(width, height);
    };

    const observer = new ResizeObserver(resize);

    observer.observe(container);

    resize();

    return () => {
      observer.disconnect();
    };
  }, [externalEngine, engineReady]);

  /**
   * ---------------------------------------------------------
   * ZOOM CONTROL
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine) return;

    currentEngine.controls.enableZoom = allowZoom;
  }, [externalEngine, allowZoom, engineReady]);

  /**
   * ---------------------------------------------------------
   * AUTO ROTATION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine) return;

    const shouldRotate =
      isRotating && graphics?.animationPreset !== "off";

    currentEngine.setAutoRotate(shouldRotate);
  }, [externalEngine, isRotating, graphics, engineReady]);

  /**
   * ---------------------------------------------------------
   * CAMERA / GRAPHICS CONFIG
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine || !graphics) return;

    if (
      typeof graphics.cameraFov === "number" &&
      Number.isFinite(graphics.cameraFov)
    ) {
      currentEngine.camera.fov = graphics.cameraFov;
      currentEngine.camera.updateProjectionMatrix();
    }

    if (
      typeof graphics.backgroundColor === "string" &&
      graphics.backgroundColor.length > 0
    ) {
      currentEngine.scene.background = new THREE.Color(
        graphics.backgroundColor,
      );
    }

    if (typeof graphics.ambientIntensity === "number") {
      currentEngine.ambientLight.intensity =
        graphics.ambientIntensity;
    }

    if (typeof graphics.keyLightIntensity === "number") {
      currentEngine.mainLight.intensity =
        graphics.keyLightIntensity;
    }

    if (typeof graphics.fillLightIntensity === "number") {
      currentEngine.fillLight.intensity =
        graphics.fillLightIntensity;
    }
  }, [externalEngine, graphics, engineReady]);

  /**
   * ---------------------------------------------------------
   * PROCEDURAL MODEL MATERIAL UPDATE
   * ---------------------------------------------------------
   *
   * Used when no external GLB/GLTF model is loaded.
   */
  useEffect(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine) return;

    const root = currentEngine.eyewearModel?.group;

    if (!root) return;

    applyMaterials(
      root,
      frameColor,
      lensColor,
      metalness,
      roughness,
      transmission,
    );
  }, [
    externalEngine,
    frameColor,
    lensColor,
    metalness,
    roughness,
    transmission,
    engineReady,
  ]);

  /**
   * ---------------------------------------------------------
   * MODEL IMPORT
   * ---------------------------------------------------------
   *
   * GLB/GLTF model becomes the actual scene model.
   *
   * This is the important bridge between the product data
   * and the 3D engine.
   */
  useEffect(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine || !engineReady) return;

    let cancelled = false;

    const loadModel = async () => {
      setLoading(true);
      setError(null);

      /**
       * No model URL:
       * use the engine's built-in EyewearModel.
       */
      if (!modelUrl) {
        importedModelRef.current = null;

        currentEngine.focusSelectedObject();

        setLoading(false);
        return;
      }

      try {
        const model = await currentEngine.importGLTF(modelUrl, {
          name: `EYECAP_${modelType}_Model`,
          center: true,
          fitCamera: true,
        });

        if (cancelled) {
          disposeObject(model);
          return;
        }

        importedModelRef.current = model;

        applyMaterials(
          model,
          frameColor,
          lensColor,
          metalness,
          roughness,
          transmission,
        );

        currentEngine.selectObject(model);

        currentEngine.focusSelectedObject();

        setLoading(false);
      } catch (err) {
        console.error("EYECAP 3D model loading failed:", err);

        if (cancelled) return;

        importedModelRef.current = null;

        setError(
          "3D model could not be loaded. Showing the default eyewear model.",
        );

        /**
         * Keep the engine alive and fall back to the
         * built-in EyewearModel.
         */
        currentEngine.clearSelection();
        currentEngine.focusSelectedObject();

        setLoading(false);
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [
    externalEngine,
    engineReady,
    modelUrl,
    modelType,
    frameColor,
    lensColor,
    metalness,
    roughness,
    transmission,
  ]);

  /**
   * ---------------------------------------------------------
   * RESET VIEW
   * ---------------------------------------------------------
   */
  const resetView = useCallback(() => {
    const currentEngine =
      externalEngine ?? internalEngineRef.current;

    if (!currentEngine) return;

    currentEngine.focusSelectedObject();
  }, [externalEngine]);

  /**
   * ---------------------------------------------------------
   * FULLSCREEN
   * ---------------------------------------------------------
   */
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;

    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  /**
   * Keep React state synchronized with browser fullscreen.
   */
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handler);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handler,
      );
    };
  }, []);

  /**
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-eyecap-surface/90 to-eyecap-dark border border-eyecap-border/60 shadow-2xl select-none ${
        isFullscreen ? "w-screen h-screen rounded-none" : ""
      } ${className}`}
      style={{
        backgroundColor:
          graphics?.backgroundColor ?? undefined,
      }}
    >
      {/* -------------------------------------------------- */}
      {/* WEBGL FALLBACK                                      */}
      {/* -------------------------------------------------- */}

      {!webglSupported && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-eyecap-dark">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt="Product preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-eyecap-muted flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-eyecap-gold mb-2" />

              <p className="text-sm">
                3D acceleration is unavailable on this
                device.
              </p>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* CANVAS                                               */}
      {/* -------------------------------------------------- */}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block outline-none"
      />

      {/* -------------------------------------------------- */}
      {/* ERROR MESSAGE                                        */}
      {/* -------------------------------------------------- */}

      {error && webglSupported && (
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-700/50 backdrop-blur-md text-[11px] text-amber-200 shadow-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />

            <span>{error}</span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* LOADING                                             */}
      {/* -------------------------------------------------- */}

      {loading && webglSupported && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-eyecap-dark/70 backdrop-blur-md pointer-events-none">
          <div className="w-12 h-12 border-2 border-eyecap-cyan/20 border-t-eyecap-cyan rounded-full animate-spin mb-3" />

          <span className="text-xs uppercase tracking-widest text-eyecap-silver flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-eyecap-cyan" />

            Loading 3D Studio
          </span>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TOP STATUS                                          */}
      {/* -------------------------------------------------- */}

      {webglSupported && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-eyecap-surface/75 backdrop-blur-md border border-eyecap-border text-[10px] text-eyecap-silver shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

            <span className="font-mono tracking-wider">
              EYECAP 3D ENGINE
            </span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* CONTROL HUD                                         */}
      {/* -------------------------------------------------- */}

      {showControls && webglSupported && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 pointer-events-none">
          {/* Drag hint */}
          <div className="flex items-center gap-2 pointer-events-auto bg-eyecap-surface/80 backdrop-blur-md border border-eyecap-border px-3 py-1.5 rounded-full text-xs text-eyecap-silver shadow-lg">
            <Eye className="w-3.5 h-3.5 text-eyecap-cyan" />

            <span className="font-mono">
              DRAG TO ROTATE 360°
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-eyecap-surface/80 backdrop-blur-md border border-eyecap-border p-1 rounded-full shadow-lg">
            {/* Auto rotation */}
            <button
              type="button"
              onClick={() => setIsRotating((value) => !value)}
              title={
                isRotating
                  ? "Pause rotation"
                  : "Auto rotate"
              }
              aria-label={
                isRotating
                  ? "Pause rotation"
                  : "Auto rotate"
              }
              className={`p-1.5 rounded-full transition-colors ${
                isRotating
                  ? "text-eyecap-cyan bg-eyecap-cyan/10"
                  : "text-eyecap-silver hover:text-white"
              }`}
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isRotating ? "animate-spin" : ""
                }`}
              />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={resetView}
              title="Reset view"
              aria-label="Reset view"
              className="p-1.5 rounded-full text-eyecap-silver hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            {allowFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                title={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Fullscreen"
                }
                aria-label={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Fullscreen"
                }
                className="p-1.5 rounded-full text-eyecap-silver hover:text-white transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* POSTER FALLBACK                                     */}
      {/* -------------------------------------------------- */}

      {!engineReady && posterUrl && (
        <img
          src={posterUrl}
          alt="Eyewear preview"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0"
        />
      )}
    </div>
  );
}