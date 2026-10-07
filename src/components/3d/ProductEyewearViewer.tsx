"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EyewearModel } from "@/engine/3d/eyewear/EyewearModel";
import {
  defaultGraphicsConfig,
  type GraphicsConfig,
} from "@/lib/graphics";

type ProductEyewearViewerProps = {
  modelType: string;
  frameColor: string;
  lensColor: string;
  metalness: number;
  roughness: number;
  transmission: number;
  graphics?: GraphicsConfig;
  modelUrl?: string | null;
  posterUrl?: string | null;
  className?: string;
};

function disposeModel(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
}

function applyProductMaterials(
  root: THREE.Object3D,
  frameColor: string,
  lensColor: string,
  metalness: number,
  roughness: number,
  transmission: number
) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const updatedMaterials = materials.map((material) => {
      const label = `${object.name} ${material.name}`.toLowerCase();
      const isFrame = /frame|bridge|temple/.test(label);
      const isLens = /lens/.test(label);
      if (!isFrame && !isLens) return material;

      const updated = material.clone();
      if ("color" in updated && updated.color instanceof THREE.Color) {
        updated.color.set(isFrame ? frameColor : lensColor);
      }
      if (updated instanceof THREE.MeshStandardMaterial) {
        updated.metalness = metalness;
        updated.roughness = roughness;
      }
      if (isLens && updated instanceof THREE.MeshPhysicalMaterial) {
        updated.transmission = transmission;
        updated.transparent = transmission > 0;
      }
      return updated;
    });

    object.material = Array.isArray(object.material)
      ? updatedMaterials
      : updatedMaterials[0];
  });
}

export default function ProductEyewearViewer({
  modelType,
  frameColor,
  lensColor,
  metalness,
  roughness,
  transmission,
  graphics,
  modelUrl,
  posterUrl,
  className,
}: ProductEyewearViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const settings = graphics ?? defaultGraphicsConfig;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setPreviewError(false);

    let disposed = false;
    let animationFrame = 0;
    let model: THREE.Object3D | null = null;
    let fallback: THREE.Group | null = null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(settings.backgroundColor);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
    } catch (error) {
      console.error("Unable to initialize product 3D preview:", error);
      setPreviewError(true);
      return;
    }

    const camera = new THREE.PerspectiveCamera(
      settings.cameraFov,
      1,
      0.1,
      1000
    );
    camera.position.set(0, 0, settings.cameraDistance * 20);

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      settings.ambientIntensity
    );
    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      settings.keyLightIntensity
    );
    keyLight.position.set(-30, 40, 50);
    const fillLight = new THREE.DirectionalLight(
      0xffffff,
      settings.fillLightIntensity
    );
    fillLight.position.set(30, 10, 20);
    const rimLight = new THREE.DirectionalLight(
      0xffffff,
      settings.rimLightIntensity
    );
    rimLight.position.set(0, 20, -40);
    scene.add(ambientLight, keyLight, fillLight, rimLight);

    const modelRoot = new THREE.Group();
    modelRoot.name = `Eyewear_${modelType}`;
    scene.add(modelRoot);

    const proceduralModel = new EyewearModel();
    proceduralModel.group.position.z = 20;
    applyProductMaterials(
      proceduralModel.group,
      frameColor,
      lensColor,
      metalness,
      roughness,
      transmission
    );
    fallback = proceduralModel.group;
    modelRoot.add(fallback);

    if (modelUrl) {
      new GLTFLoader().load(
        modelUrl,
        (gltf) => {
          if (disposed) {
            disposeModel(gltf.scene);
            return;
          }

          const loadedModel = gltf.scene;
          const initialBounds = new THREE.Box3().setFromObject(loadedModel);
          const size = initialBounds.getSize(new THREE.Vector3());
          const largestDimension = Math.max(size.x, size.y, size.z);
          if (largestDimension > 0) {
            loadedModel.scale.setScalar(50 / largestDimension);
            const center = new THREE.Box3()
              .setFromObject(loadedModel)
              .getCenter(new THREE.Vector3());
            loadedModel.position.sub(center);
          }

          applyProductMaterials(
            loadedModel,
            frameColor,
            lensColor,
            metalness,
            roughness,
            transmission
          );
          if (fallback) {
            modelRoot.remove(fallback);
            disposeModel(fallback);
            fallback = null;
          }
          modelRoot.add(loadedModel);
          model = loadedModel;
        },
        undefined,
        (error) => {
          if (disposed) return;
          console.error("Unable to load product 3D model:", error);
          setPreviewError(true);
        }
      );
    }

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (!clientWidth || !clientHeight) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      modelRoot.rotation.y += (event.clientX - pointerX) * 0.01;
      modelRoot.rotation.x = THREE.MathUtils.clamp(
        modelRoot.rotation.x + (event.clientY - pointerY) * 0.01,
        -0.7,
        0.7
      );
      pointerX = event.clientX;
      pointerY = event.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const render = (time: number) => {
      if (settings.animationPreset !== "off" && !dragging) {
        modelRoot.rotation.y += 0.003;
        if (settings.animationPreset === "floating") {
          modelRoot.position.y = Math.sin(time * 0.001) * 0.7;
        }
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      if (model) disposeModel(model);
      if (fallback) disposeModel(fallback);
      renderer.dispose();
    };
  }, [
    frameColor,
    graphics,
    lensColor,
    metalness,
    modelType,
    modelUrl,
    roughness,
    settings,
    transmission,
  ]);

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive 3D eyewear preview"
        className="relative z-0 block h-full w-full cursor-grab touch-none active:cursor-grabbing"
      />
      {previewError && (
        <div
          className="absolute inset-x-0 bottom-0 z-20 bg-black/70 px-3 py-2 text-center text-xs text-white"
          role="status"
        >
          {posterUrl
            ? "3D preview unavailable. Showing the product image."
            : "3D preview unavailable."}
        </div>
      )}
      {previewError && posterUrl && (
        <img
          src={posterUrl}
          alt="Product preview"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
