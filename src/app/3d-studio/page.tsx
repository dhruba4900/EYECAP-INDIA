"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Box,
  Camera,
  Download,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";

import {
  EngineContext,
  MaterialPreset,
  RenderStyle,
} from "@/engine/3d/core/EngineContext";

import { StudioViewport } from "@/components/3d-studio/Viewport/StudioViewport";
import AI3DGeneratorPanel from "@/components/3d-studio/AI3DGenerator/AI3DGeneratorPanel";
import BrandLogo from "@/components/layout/BrandLogo";

type UITheme = "dark" | "light" | "custom";
type TransformMode = "translate" | "rotate" | "scale";
type LightingPreset = "studio" | "warm" | "cool" | "dramatic";

export default function ThreeDStudioPage() {
  const engineRef =
    useRef<EngineContext | null>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [selectedNode, setSelectedNode] =
    useState("Frame_Left");

  const [color, setColor] =
    useState("#111111");

  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const [isAutoRotate, setIsAutoRotate] =
    useState(false);

  const [uiTheme, setUiTheme] =
    useState<UITheme>("dark");

  const [customUiBg, setCustomUiBg] =
    useState("#1e293b");

  const [explodeAmount, setExplodeAmount] =
    useState(0);

  const [renderStyle, setRenderStyle] =
    useState<RenderStyle>("default");

  const [lightPreset, setLightPreset] =
    useState<LightingPreset>("studio");

  const [lightIntensity, setLightIntensity] =
    useState(2);

  const [viewportBg, setViewportBg] =
    useState("#141414");

  const nodes = [
    { name: "Frame_Left", label: "Left Frame Ring" },
    { name: "Frame_Right", label: "Right Frame Ring" },
    { name: "Frame_Bridge", label: "Frame Bridge" },
    { name: "Lens_Left", label: "Left Lens" },
    { name: "Lens_Right", label: "Right Lens" },
    { name: "Temple_Left", label: "Left Temple Handle" },
    { name: "Temple_Right", label: "Right Temple Handle" },
  ];

  const materialPresets: {
    id: MaterialPreset;
    label: string;
  }[] = [
    { id: "gold", label: "Gold" },
    { id: "chrome", label: "Chrome" },
    { id: "mattePlastic", label: "Matte" },
    { id: "glossyPlastic", label: "Glossy" },
    { id: "tintedGlass", label: "Glass" },
  ];

  const isLight = uiTheme === "light";
  const isCustom = uiTheme === "custom";

  const wrapperClass = isLight
    ? "bg-slate-100 text-slate-900"
    : "bg-neutral-950 text-neutral-100";

  const sidebarClass = isLight
    ? "bg-slate-50 border-slate-300 text-slate-900"
    : isCustom
      ? "bg-black/20 border-white/10 text-white"
      : "bg-neutral-900 border-neutral-800 text-neutral-200";

  const cardClass = isLight
    ? "bg-white border-slate-300 shadow-sm text-slate-900"
    : "bg-neutral-950/60 border-neutral-800 text-white";

  const mutedClass = isLight
    ? "text-slate-600"
    : "text-neutral-400";

  const borderClass = isLight
    ? "border-slate-300"
    : "border-neutral-800";

  const customStyle = isCustom
    ? { backgroundColor: customUiBg }
    : undefined;

  const selectNode = (name: string) => {
    setSelectedNode(name);

    const engine = engineRef.current;

    if (!engine) return;

    engine.selectObjectByName(name);
    setColor(
      engine.getSelectedNodeColor(name)
    );
  };

  const changeColor = (nextColor: string) => {
    setColor(nextColor);

    engineRef.current?.setNodeColor(
      selectedNode,
      nextColor
    );
  };

  const applyPreset = (
    preset: MaterialPreset
  ) => {
    const engine = engineRef.current;

    if (!engine) return;

    engine.applyMaterialPreset(
      selectedNode,
      preset
    );

    setColor(
      engine.getSelectedNodeColor(
        selectedNode
      )
    );
  };

  const changeTheme = (theme: UITheme) => {
    setUiTheme(theme);

    const background =
      theme === "light"
        ? "#f1f5f9"
        : theme === "custom"
          ? customUiBg
          : "#141414";

    setViewportBg(background);
    engineRef.current?.setBackgroundColor(
      background
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen((value) => !value);
  };

  const saveConfig = () => {
    const engine = engineRef.current;

    if (!engine) return;

    const blob = new Blob(
      [engine.exportConfigurationJSON()],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "eyecap_3d_config.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  };

  return (
    <div
      style={customStyle}
      className={[
        "fixed inset-0 z-[9999]",
        "flex flex-col h-screen w-screen",
        "overflow-hidden",
        "transition-colors duration-200",
        wrapperClass,
      ].join(" ")}
    >
      <header
        className={[
          "h-12 shrink-0 border-b px-3",
          "flex items-center justify-between",
          sidebarClass,
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <BrandLogo className="h-8 w-8 object-contain" />

          <div className="font-bold tracking-wider text-xs">
            EYECAP 3D STUDIO
          </div>

          <span className="rounded bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white">
            AI PRO
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              engineRef.current?.focusSelectedObject()
            }
            className="rounded-lg bg-neutral-800 px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            Focus
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !isAutoRotate;
              setIsAutoRotate(next);
              engineRef.current?.setAutoRotate(next);
            }}
            className={[
              "rounded-lg px-2.5 py-1.5 text-[10px] font-bold",
              isAutoRotate
                ? "bg-emerald-600 text-white"
                : "bg-neutral-800 text-neutral-300",
            ].join(" ")}
          >
            360°
          </button>

          <button
            type="button"
            onClick={saveConfig}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            <Save className="h-3 w-3" />
            Config
          </button>

          <button
            type="button"
            onClick={() =>
              engineRef.current?.captureSnapshot(
                "eyecap_render.png"
              )
            }
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            <Camera className="h-3 w-3" />
            Snapshot
          </button>

          <button
            type="button"
            onClick={() =>
              engineRef.current?.exportModel(
                "eyecap_model.glb"
              )
            }
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            <Download className="h-3 w-3" />
            GLB
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:text-white"
            title={
              isFullscreen
                ? "Exit fullscreen"
                : "Fullscreen"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-[10px] font-bold text-neutral-300 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Storefront
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          style={customStyle}
          className={[
            "w-60 shrink-0 overflow-y-auto border-r p-3",
            "space-y-3",
            sidebarClass,
          ].join(" ")}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider">
            Scene Hierarchy
          </div>

          <div
            className={[
              "rounded-xl border p-2",
              cardClass,
            ].join(" ")}
          >
            <div className="mb-2 text-[10px] font-bold text-purple-400">
              Eyewear_Root
            </div>

            <div className="space-y-1">
              {nodes.map((node) => (
                <button
                  key={node.name}
                  type="button"
                  onClick={() =>
                    selectNode(node.name)
                  }
                  className={[
                    "w-full rounded-lg px-2.5 py-2",
                    "text-left text-[10px]",
                    "transition",
                    selectedNode === node.name
                      ? "bg-blue-600 font-bold text-white"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                  ].join(" ")}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              Inspection
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  "default",
                  "wireframe",
                  "clay",
                ] as const
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setRenderStyle(mode);
                    engineRef.current?.setRenderStyle(
                      mode
                    );
                  }}
                  className={[
                    "rounded-lg px-1 py-1.5 text-[9px] font-bold capitalize",
                    renderStyle === mode
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-400",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              Studio Theme
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  "dark",
                  "light",
                  "custom",
                ] as const
              ).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() =>
                    changeTheme(theme)
                  }
                  className={[
                    "rounded-lg py-1.5 text-[9px] font-bold capitalize",
                    uiTheme === theme
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-400",
                  ].join(" ")}
                >
                  {theme}
                </button>
              ))}
            </div>

            {uiTheme === "custom" && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px]">
                  UI color
                </span>

                <input
                  type="color"
                  value={customUiBg}
                  onChange={(event) => {
                    const next =
                      event.target.value;

                    setCustomUiBg(next);
                    setViewportBg(next);
                    engineRef.current?.setBackgroundColor(
                      next
                    );
                  }}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                />
              </div>
            )}
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-hidden">
          <StudioViewport
            engineRefProp={engineRef}
            uiTheme={uiTheme}
          />
        </main>

        <aside
          style={customStyle}
          className={[
            "w-[330px] shrink-0 overflow-y-auto border-l p-3",
            "space-y-3",
            sidebarClass,
          ].join(" ")}
        >
          <AI3DGeneratorPanel
            engineRef={engineRef}
          />

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              Transform
            </div>

            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  "translate",
                  "rotate",
                  "scale",
                ] as const
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setTransformMode(mode);
                    engineRef.current?.setTransformMode(
                      mode
                    );
                  }}
                  className={[
                    "rounded-lg py-1.5 text-[9px] font-bold capitalize",
                    transformMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-400",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              <span>Exploded View</span>
              <span>
                {Math.round(
                  explodeAmount * 100
                )}
                %
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodeAmount}
              onChange={(event) => {
                const value =
                  Number(event.target.value);

                setExplodeAmount(value);
                engineRef.current?.setExplodeAmount(
                  value
                );
              }}
              className="w-full accent-blue-600"
            />
          </div>

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-3 text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              Material & Color
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px]">
                Selected Color
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(event) =>
                    changeColor(
                      event.target.value
                    )
                  }
                  className="h-7 w-7 cursor-pointer rounded bg-transparent"
                />

                <span className="font-mono text-[9px] font-bold">
                  {color.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-neutral-800 pt-3">
              <div className="mb-2 text-[9px] font-bold text-neutral-500">
                MATERIAL PRESETS
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {materialPresets.map(
                  (preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        applyPreset(
                          preset.id
                        )
                      }
                      className="rounded-lg bg-neutral-800 px-2 py-1.5 text-[9px] font-bold text-neutral-200 hover:bg-neutral-700"
                    >
                      {preset.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div
            className={[
              "rounded-xl border p-3",
              cardClass,
            ].join(" ")}
          >
            <div
              className={[
                "mb-2 text-[10px] font-bold uppercase tracking-wider",
                mutedClass,
              ].join(" ")}
            >
              Lighting
            </div>

            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  "studio",
                  "warm",
                  "cool",
                  "dramatic",
                ] as const
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setLightPreset(
                      preset
                    );

                    engineRef.current?.setLightingPreset(
                      preset
                    );
                  }}
                  className={[
                    "rounded-lg py-1.5 text-[9px] font-bold capitalize",
                    lightPreset === preset
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-400",
                  ].join(" ")}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[9px]">
                <span>Intensity</span>
                <span className="font-mono">
                  {lightIntensity.toFixed(1)}
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={lightIntensity}
                onChange={(event) => {
                  const value =
                    Number(event.target.value);

                  setLightIntensity(value);
                  engineRef.current?.setLightIntensity(
                    value
                  );
                }}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] font-medium">
                3D Background
              </span>

              <input
                type="color"
                value={viewportBg}
                onChange={(event) => {
                  const next =
                    event.target.value;

                  setViewportBg(next);
                  engineRef.current?.setBackgroundColor(
                    next
                  );
                }}
                className="h-6 w-6 cursor-pointer rounded bg-transparent"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
