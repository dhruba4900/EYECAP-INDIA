"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Eye, RotateCw, ZoomIn, ZoomOut, Sparkles, AlertCircle } from "lucide-react";
import type { GraphicsConfig } from "@/lib/graphics";

function disposeModel(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
  });
}

function devicePixelRatio(quality: GraphicsConfig["qualityPreset"] = "auto") {
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (quality === "low" || (quality === "auto" && (mobile || saveData))) return 1;
  if (quality === "medium" || (quality === "auto" && mobile)) return Math.min(window.devicePixelRatio, 1.5);
  return Math.min(window.devicePixelRatio, 2);
}

interface EyewearViewerProps {
  modelType?: string; // "geometric" | "aviator" | "rectangular" | "round" | "smart_audio"
  frameColor?: string;
  lensColor?: string;
  metalness?: number;
  roughness?: number;
  transmission?: number;
  posterUrl?: string;
  modelUrl?: string | null;
  autoRotate?: boolean;
  graphics?: GraphicsConfig;
  className?: string;
  allowZoom?: boolean;
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
  autoRotate = true,
  graphics,
  className = "w-full h-[450px]",
}: EyewearViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const isRotatingRef = useRef(autoRotate && graphics?.animationPreset !== "off");
  const graphicsRef = useRef(graphics);
  const wakeRendererRef = useRef<() => void>(() => {});
  const glassesGroupRef = useRef<THREE.Group | null>(null);
  const frameMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lensMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Update material colors in real time when props change
  useEffect(() => {
    graphicsRef.current = graphics;
    isRotatingRef.current = isRotating && graphics?.animationPreset !== "off";
    const config = graphics;
    if (cameraRef.current && config) {
      cameraRef.current.fov = config.cameraFov;
      cameraRef.current.position.z = config.cameraDistance;
      cameraRef.current.updateProjectionMatrix();
    }
    if (ambientLightRef.current && config) ambientLightRef.current.intensity = config.ambientIntensity;
    if (keyLightRef.current && config) keyLightRef.current.intensity = config.keyLightIntensity;
    if (fillLightRef.current && config) fillLightRef.current.intensity = config.fillLightIntensity;
    if (rimLightRef.current && config) rimLightRef.current.intensity = config.rimLightIntensity;
    if (rendererRef.current) rendererRef.current.setPixelRatio(devicePixelRatio(config?.qualityPreset));
    wakeRendererRef.current();
  }, [graphics, isRotating]);

  useEffect(() => {
    if (frameMaterialRef.current) {
      frameMaterialRef.current.color.set(frameColor);
      frameMaterialRef.current.metalness = metalness;
      frameMaterialRef.current.roughness = roughness;
    }
    if (lensMaterialRef.current) {
      lensMaterialRef.current.color.set(lensColor);
      lensMaterialRef.current.transmission = transmission;
    }
  }, [frameColor, lensColor, metalness, roughness, transmission]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    setLoading(true);

    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        setLoading(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      setLoading(false);
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(graphics?.cameraFov || 45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, graphics?.cameraDistance || 4.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(devicePixelRatio(graphics?.qualityPreset));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      isRotatingRef.current = false;
      setIsRotating(false);
    }

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, graphics?.ambientIntensity ?? 1.2);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, graphics?.keyLightIntensity ?? 2.5);
    keyLightRef.current = keyLight;
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90b0e0, graphics?.fillLightIntensity ?? 1.2);
    fillLightRef.current = fillLight;
    fillLight.position.set(-4, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, graphics?.rimLightIntensity ?? 1.5);
    rimLightRef.current = rimLight;
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Materials
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(frameColor),
      metalness: metalness,
      roughness: roughness,
      envMapIntensity: 1.0,
    });
    frameMaterialRef.current = frameMat;

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(lensColor),
      transparent: true,
      opacity: 0.85,
      roughness: 0.05,
      metalness: 0.1,
      transmission: transmission,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    lensMaterialRef.current = lensMat;

    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.95,
      roughness: 0.15,
    });

    const padMat = new THREE.MeshPhysicalMaterial({
      color: 0xf3f4f6,
      transparent: true,
      opacity: 0.6,
      roughness: 0.3,
    });

    // Root glasses group
    const glassesGroup = new THREE.Group();
    glassesGroupRef.current = glassesGroup;
    let activeGlassesGroup = glassesGroup;

    // Build procedural 3D model according to archetype
    const isAviator = modelType === "aviator";
    const isRect = modelType === "rectangular";
    const isSmartAudio = modelType === "smart_audio";
    const rimRadiusX = isAviator ? 0.75 : isRect ? 0.85 : 0.72;
    const rimRadiusY = isAviator ? 0.85 : isRect ? 0.55 : 0.70;
    const bridgeSpan = 0.42;

    // Procedural Rim Function
    const createRim = (isLeft: boolean) => {
      const rimGroup = new THREE.Group();
      const posX = isLeft ? -0.95 : 0.95;

      // Rim Mesh
      let rimGeom: THREE.BufferGeometry;
      if (modelType === "geometric") {
        // Octagonal faceted ring
        rimGeom = new THREE.TorusGeometry(0.72, 0.038, 16, 8);
      } else if (isRect) {
        // Sleek rectangular ring
        rimGeom = new THREE.TorusGeometry(0.70, 0.042, 16, 4);
        rimGeom.rotateZ(Math.PI / 4);
      } else {
        // Aviator / Classic Oval
        rimGeom = new THREE.TorusGeometry(0.74, 0.036, 24, 36);
      }

      const rimMesh = new THREE.Mesh(rimGeom, frameMat);
      rimMesh.scale.set(rimRadiusX, rimRadiusY, 1);
      rimMesh.castShadow = true;
      rimGroup.add(rimMesh);

      // Lens Mesh
      const lensGeom = new THREE.CylinderGeometry(0.70 * rimRadiusX, 0.70 * rimRadiusX, 0.02, 32);
      lensGeom.rotateX(Math.PI / 2);
      const lensMesh = new THREE.Mesh(lensGeom, lensMat);
      lensMesh.scale.set(1, rimRadiusY / rimRadiusX, 1);
      rimGroup.add(lensMesh);

      // Nose pad
      const padGeom = new THREE.CapsuleGeometry(0.04, 0.12, 8, 16);
      const padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.set(isLeft ? 0.48 : -0.48, -0.22, -0.12);
      padMesh.rotation.z = isLeft ? -0.3 : 0.3;
      rimGroup.add(padMesh);

      rimGroup.position.x = posX;
      return rimGroup;
    };

    // Add Left & Right Rims
    glassesGroup.add(createRim(true));
    glassesGroup.add(createRim(false));

    // Nose Bridge (Arched cylinder)
    const bridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.45, 0.05, 0),
      new THREE.Vector3(0, 0.22, 0.05),
      new THREE.Vector3(0.45, 0.05, 0)
    );
    const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 20, 0.036, 12, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, frameMat);
    glassesGroup.add(bridgeMesh);

    // Aviator Brow Bar
    if (isAviator) {
      const browGeom = new THREE.CylinderGeometry(0.028, 0.028, 1.8, 16);
      browGeom.rotateZ(Math.PI / 2);
      const browMesh = new THREE.Mesh(browGeom, frameMat);
      browMesh.position.set(0, 0.65, 0.02);
      glassesGroup.add(browMesh);
    }

    // Temples / Side Arms
    const createTemple = (isLeft: boolean) => {
      const templeGroup = new THREE.Group();
      const startX = isLeft ? -1.55 : 1.55;

      // Hinge block
      const hingeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.12);
      const hingeMesh = new THREE.Mesh(hingeGeom, hingeMat);
      hingeMesh.position.set(startX, 0.08, 0);
      templeGroup.add(hingeMesh);

      // Temple arm extending back (-Z direction)
      const armThickness = isSmartAudio ? 0.12 : 0.038;
      const armHeight = isSmartAudio ? 0.18 : 0.065;
      const armLength = 2.4;

      const armGeom = new THREE.BoxGeometry(armThickness, armHeight, armLength);
      const armMesh = new THREE.Mesh(armGeom, frameMat);
      armMesh.position.set(startX, 0.08, -armLength / 2);
      templeGroup.add(armMesh);

      // Ergonomic curved earpiece
      const tipCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startX, 0.08, -armLength),
        new THREE.Vector3(startX + (isLeft ? 0.05 : -0.05), -0.15, -armLength - 0.3),
        new THREE.Vector3(startX + (isLeft ? 0.08 : -0.08), -0.35, -armLength - 0.45)
      );
      const tipGeom = new THREE.TubeGeometry(tipCurve, 16, armThickness * 0.9, 12, false);
      const tipMesh = new THREE.Mesh(tipGeom, frameMat);
      templeGroup.add(tipMesh);

      // Smart Audio Speaker Grille
      if (isSmartAudio) {
        const grilleGeom = new THREE.BoxGeometry(0.02, 0.06, 0.4);
        const grilleMat = new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x00e5ff,
          emissiveIntensity: 0.4,
        });
        const grilleMesh = new THREE.Mesh(grilleGeom, grilleMat);
        grilleMesh.position.set(startX + (isLeft ? 0.06 : -0.06), 0.08, -1.2);
        templeGroup.add(grilleMesh);
      }

      return templeGroup;
    };

    glassesGroup.add(createTemple(true));
    glassesGroup.add(createTemple(false));

    // Center and tilt slightly for cinematic hero presentation
    glassesGroup.position.set(0, 0, 0);
    glassesGroup.rotation.set(0.12, -0.25, 0);
    scene.add(glassesGroup);

    if (modelUrl) {
      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          if (!active) {
            disposeModel(gltf.scene);
            return;
          }
          const bounds = new THREE.Box3().setFromObject(gltf.scene);
          const size = bounds.getSize(new THREE.Vector3());
          const largestDimension = Math.max(size.x, size.y, size.z);
          if (Number.isFinite(largestDimension) && largestDimension > 0) {
            gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3()));
            gltf.scene.scale.setScalar(3.1 / largestDimension);
          }
          scene.remove(glassesGroup);
          activeGlassesGroup = new THREE.Group();
          activeGlassesGroup.add(gltf.scene);
          scene.add(activeGlassesGroup);
          glassesGroupRef.current = activeGlassesGroup;
          setLoading(false);
        },
        undefined,
        (error) => {
          if (active) {
            console.error("3D model load error; showing procedural fallback:", error);
            setLoading(false);
          }
        }
      );
    } else {
      setLoading(false);
    }

    // Mouse & Touch Interactivity (Orbital drag without full OrbitControls dependency)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = -0.25;
    let targetRotationX = 0.12;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      wakeRendererRef.current();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;

      // Clamp vertical pitch to avoid flipping upside down
      targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onPointerDown);
    domElement.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    domElement.addEventListener("touchstart", onPointerDown, { passive: true });
    domElement.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number | null = null;
    let inViewport = true;
    const animate = () => {
      animationFrameId = null;
      if (document.hidden || !inViewport) return;

      if (activeGlassesGroup) {
        if (isRotatingRef.current && !isDragging) {
          targetRotationY += graphicsRef.current?.animationPreset === "floating" ? 0.002 : 0.005;
        }

        // Smooth damping
        activeGlassesGroup.rotation.y += (targetRotationY - activeGlassesGroup.rotation.y) * 0.08;
        activeGlassesGroup.rotation.x += (targetRotationX - activeGlassesGroup.rotation.x) * 0.08;

        // Subtle floating wave
        activeGlassesGroup.position.y = graphicsRef.current?.animationPreset === "floating"
          ? Math.sin(Date.now() * 0.0018) * 0.05
          : 0;
      }

      renderer.render(scene, camera);
      const config = graphicsRef.current;
      if (
        (isRotatingRef.current && config?.animationPreset !== "off") ||
        isDragging ||
        Math.abs(activeGlassesGroup.rotation.y - targetRotationY) > 0.001 ||
        Math.abs(activeGlassesGroup.rotation.x - targetRotationX) > 0.001 ||
        config?.animationPreset === "floating"
      ) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const resumeAnimation = () => {
      if (!document.hidden && inViewport && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    wakeRendererRef.current = resumeAnimation;
    const handleVisibilityChange = () => {
      if (document.hidden && animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      } else {
        resumeAnimation();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) {
        resumeAnimation();
      } else if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });
    observer.observe(container);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resumeAnimation();

    return () => {
      active = false;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeRendererRef.current = () => {};
      domElement.removeEventListener("mousedown", onPointerDown);
      domElement.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      domElement.removeEventListener("touchstart", onPointerDown);
      domElement.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("resize", handleResize);
      disposeModel(glassesGroup);
      if (activeGlassesGroup !== glassesGroup) disposeModel(activeGlassesGroup);
      renderer.dispose();
      cameraRef.current = null;
      rendererRef.current = null;
      ambientLightRef.current = null;
      keyLightRef.current = null;
      fillLightRef.current = null;
      rimLightRef.current = null;
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [modelType, modelUrl, graphics]);

  const resetView = () => {
    if (glassesGroupRef.current) {
      glassesGroupRef.current.rotation.set(0.12, -0.25, 0);
    }
  };

  return (
    <div style={{ backgroundColor: graphics?.backgroundColor }} className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-eyecap-surface/90 to-eyecap-dark border border-eyecap-border/60 shadow-2xl select-none ${className}`}>
      {/* Fallback if WebGL unsupported */}
      {!webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {posterUrl ? (
            <img src={posterUrl} alt="Product preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-eyecap-muted flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-eyecap-gold mb-2" />
              <p className="text-sm">3D acceleration disabled on this device. Displaying high-res 2D mode.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-eyecap-dark/80 backdrop-blur-md z-10 transition-opacity">
          <div className="w-12 h-12 border-2 border-eyecap-cyan/20 border-t-eyecap-cyan rounded-full animate-spin mb-3"></div>
          <span className="text-xs uppercase tracking-widest text-eyecap-silver flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-eyecap-cyan" /> Initializing 3D Ray-Tracer
          </span>
        </div>
      )}

      {/* 3D Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Control HUD Overlay */}
      {webglSupported && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-eyecap-surface/80 backdrop-blur-md border border-eyecap-border px-3 py-1.5 rounded-full text-xs text-eyecap-silver shadow-lg">
            <Eye className="w-3.5 h-3.5 text-eyecap-cyan" />
            <span className="font-mono">DRAG TO ROTATE 360°</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto bg-eyecap-surface/80 backdrop-blur-md border border-eyecap-border p-1 rounded-full shadow-lg">
            <button
              onClick={() => setIsRotating(!isRotating)}
              title={isRotating ? "Pause rotation" : "Auto-rotate"}
              className={`p-1.5 rounded-full transition-colors ${
                isRotating ? "text-eyecap-cyan bg-eyecap-cyan/10" : "text-eyecap-silver hover:text-white"
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={resetView}
              title="Reset angle"
              className="p-1.5 rounded-full text-eyecap-silver hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
