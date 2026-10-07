import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { EyewearModel } from "../eyewear/EyewearModel";

/* ================================================================
   TYPES
================================================================ */

export interface EngineConfig {
  canvas: HTMLCanvasElement;

  antialias?: boolean;
  alpha?: boolean;

  backgroundColor?: string;

  enableShadows?: boolean;

  /**
   * Maximum device pixel ratio used by renderer.
   * 1.5 is generally a good laptop/mobile value.
   * 2 gives higher quality but costs more GPU.
   */
  maxPixelRatio?: number;

  /**
   * Required for high quality canvas screenshots.
   * Keep true for Studio export/snapshot workflow.
   */
  preserveDrawingBuffer?: boolean;

  /**
   * Enable physically correct lighting workflow.
   */
  physicallyCorrectLights?: boolean;

  /**
   * Enable automatic color management.
   */
  colorManagement?: boolean;
}

export type MaterialPreset =
  | "gold"
  | "chrome"
  | "mattePlastic"
  | "glossyPlastic"
  | "tintedGlass"
  | "silver"
  | "blackGlass";

export type RenderStyle =
  | "default"
  | "wireframe"
  | "clay";

export type LightingPreset =
  | "studio"
  | "warm"
  | "cool"
  | "dramatic";

export type TransformMode =
  | "translate"
  | "rotate"
  | "scale";

export type TransformSpace =
  | "world"
  | "local";

export interface ModelLoadOptions {
  center?: boolean;
  fitCamera?: boolean;
  name?: string;
  select?: boolean;
}

export interface ReferencePlaneOptions {
  opacity?: number;
  scale?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  width?: number;
  height?: number;
  name?: string;
}

export interface ExportOptions {
  filename?: string;
  onlyVisible?: boolean;
  trs?: boolean;
}

export interface EngineStats {
  fps: number;
  frameTime: number;
  triangles: number;
  geometries: number;
  textures: number;
  objects: number;
}

/* ================================================================
   ENGINE EVENT TYPES
================================================================ */

export type EngineEventName =
  | "ready"
  | "modelLoaded"
  | "modelRemoved"
  | "selectionChanged"
  | "transformChanged"
  | "resize"
  | "disposed";

export type EngineEventCallback =
  (...args: unknown[]) => void;

/* ================================================================
   ENGINE CONTEXT
================================================================ */

export class EngineContext {
  /* ---------------------------------------------------------------
     PUBLIC THREE.JS CORE
  ---------------------------------------------------------------- */

  public readonly scene: THREE.Scene;

  public readonly camera: THREE.PerspectiveCamera;

  public readonly renderer: THREE.WebGLRenderer;

  public readonly controls: OrbitControls;

  public readonly transformControls: TransformControls;

  /* ---------------------------------------------------------------
     DEFAULT / LEGACY EYEWEAR MODEL
  ---------------------------------------------------------------- */

  public eyewearModel!: EyewearModel;

  /* ---------------------------------------------------------------
     LIGHTS
  ---------------------------------------------------------------- */

  public ambientLight!: THREE.AmbientLight;

  public mainLight!: THREE.DirectionalLight;

  public fillLight!: THREE.DirectionalLight;

  /* ---------------------------------------------------------------
     SELECTION
  ---------------------------------------------------------------- */

  public selectedObject: THREE.Object3D | null = null;

  /* ---------------------------------------------------------------
     INTERNAL
  ---------------------------------------------------------------- */

  private readonly canvas: HTMLCanvasElement;

  private readonly environmentGroup: THREE.Group;

  private readonly referenceGroup: THREE.Group;

  private importedModel: THREE.Group | null = null;

  private isRunning = false;

  private disposed = false;

  private animationFrameId: number | null = null;

  private lastFrameTime = 0;

  private fpsAccumulator = 0;

  private fpsFrames = 0;

  private currentFPS = 0;

  private currentFrameTime = 0;

  private maxPixelRatio = 2;

  private currentRenderStyle: RenderStyle = "default";

  private currentLightingPreset: LightingPreset = "studio";

  private autoRotateEnabled = false;

  private originalMaterials = new Map<
    THREE.Mesh,
    THREE.Material | THREE.Material[]
  >();

  private renderStyleMaterials = new Map<
    THREE.Mesh,
    THREE.Material | THREE.Material[]
  >();

  private originalTransforms = new Map<
    THREE.Object3D,
    {
      position: THREE.Vector3;
      rotation: THREE.Euler;
      scale: THREE.Vector3;
    }
  >();

  private eventListeners = new Map<
    EngineEventName,
    Set<EngineEventCallback>
  >();

  /* ---------------------------------------------------------------
     REUSABLE HELPERS
  ---------------------------------------------------------------- */

  private readonly box = new THREE.Box3();

  private readonly boxCenter = new THREE.Vector3();

  private readonly boxSize = new THREE.Vector3();

  private readonly cameraDirection = new THREE.Vector3();

  private readonly clock = new THREE.Clock();

  /* ================================================================
     CONSTRUCTOR
  ================================================================= */

  constructor(config: EngineConfig) {
    if (typeof window === "undefined") {
      throw new Error(
        "EngineContext must be initialized in a browser environment."
      );
    }

    if (!config.canvas) {
      throw new Error(
        "EYECAP 3D Engine: Canvas element is required."
      );
    }

    this.canvas = config.canvas;

    this.maxPixelRatio = Math.max(
      1,
      config.maxPixelRatio ?? 2
    );

    /* --------------------------------------------------------------
       SCENE
    -------------------------------------------------------------- */

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(
      config.backgroundColor ?? "#141414"
    );

    /* --------------------------------------------------------------
       CAMERA
    -------------------------------------------------------------- */

    const width = Math.max(
      this.canvas.clientWidth || 800,
      1
    );

    const height = Math.max(
      this.canvas.clientHeight || 600,
      1
    );

    this.camera =
      new THREE.PerspectiveCamera(
        45,
        width / height,
        0.01,
        5000
      );

    this.camera.position.set(
      0,
      20,
      100
    );

    /* --------------------------------------------------------------
       RENDERER
    -------------------------------------------------------------- */

    this.renderer =
      new THREE.WebGLRenderer({
        canvas: this.canvas,

        antialias:
          config.antialias ?? true,

        alpha:
          config.alpha ?? false,

        powerPreference:
          "high-performance",

        preserveDrawingBuffer:
          config.preserveDrawingBuffer ?? true,
      });

    this.renderer.setSize(
      width,
      height,
      false
    );

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        this.maxPixelRatio
      )
    );

    /*
     * Modern Three.js color pipeline.
     */
    if (
      "outputColorSpace" in
      this.renderer
    ) {
      this.renderer.outputColorSpace =
        THREE.SRGBColorSpace;
    }

    this.renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure =
      1.1;

    this.renderer.shadowMap.enabled =
      config.enableShadows ?? true;

    this.renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display =
      "block";

    this.renderer.domElement.style.width =
      "100%";

    this.renderer.domElement.style.height =
      "100%";

    /* --------------------------------------------------------------
       ORBIT CONTROLS
    -------------------------------------------------------------- */

    this.controls =
      new OrbitControls(
        this.camera,
        this.renderer.domElement
      );

    this.controls.enableDamping = true;

    this.controls.dampingFactor = 0.06;

    this.controls.enablePan = true;

    this.controls.enableZoom = true;

    this.controls.enableRotate = true;

    this.controls.screenSpacePanning = true;

    this.controls.minDistance = 0.01;

    this.controls.maxDistance = 5000;

    this.controls.target.set(
      0,
      0,
      0
    );

    this.controls.autoRotate = false;

    this.controls.autoRotateSpeed = 2;

    /* --------------------------------------------------------------
       TRANSFORM CONTROLS
    -------------------------------------------------------------- */

    this.transformControls =
      new TransformControls(
        this.camera,
        this.renderer.domElement
      );

    this.transformControls.size =
      0.8;

    const transformHelper =
      this.transformControls.getHelper();

    this.scene.add(
      transformHelper
    );

    /*
     * Disable orbit controls while
     * transform gizmo is being dragged.
     */
    this.transformControls.addEventListener(
      "dragging-changed",
      (event) => {
        const dragging =
          Boolean(
            (
              event as {
                value?: boolean;
              }
            ).value
          );

        this.controls.enabled =
          !dragging;
      }
    );

    this.transformControls.addEventListener(
      "objectChange",
      () => {
        if (!this.selectedObject) {
          return;
        }

        this.selectedObject.updateMatrixWorld(
          true
        );

        this.emit(
          "transformChanged",
          this.selectedObject
        );
      }
    );

    /* --------------------------------------------------------------
       ENGINE GROUPS
    -------------------------------------------------------------- */

    this.environmentGroup =
      new THREE.Group();

    this.environmentGroup.name =
      "EYECAP_Environment";

    this.referenceGroup =
      new THREE.Group();

    this.referenceGroup.name =
      "EYECAP_Reference_Images";

    this.scene.add(
      this.environmentGroup
    );

    this.scene.add(
      this.referenceGroup
    );

    /* --------------------------------------------------------------
       LIGHTING
    -------------------------------------------------------------- */

    this.setupDefaultLights();

    /* --------------------------------------------------------------
       LEGACY EYEWEAR MODEL
    -------------------------------------------------------------- */

    this.loadInitialEyewear();

    this.emit("ready");
  }

  /* ================================================================
     LIGHTING
  ================================================================= */

  private setupDefaultLights(): void {
    this.ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        1.2
      );

    this.mainLight =
      new THREE.DirectionalLight(
        0xffffff,
        2.4
      );

    this.mainLight.position.set(
      50,
      80,
      60
    );

    this.mainLight.castShadow = true;

    this.mainLight.shadow.mapSize.set(
      2048,
      2048
    );

    this.mainLight.shadow.camera.near =
      0.1;

    this.mainLight.shadow.camera.far =
      500;

    this.mainLight.shadow.camera.left =
      -100;

    this.mainLight.shadow.camera.right =
      100;

    this.mainLight.shadow.camera.top =
      100;

    this.mainLight.shadow.camera.bottom =
      -100;

    this.fillLight =
      new THREE.DirectionalLight(
        0xffffff,
        1.2
      );

    this.fillLight.position.set(
      -50,
      20,
      -50
    );

    this.scene.add(
      this.ambientLight,
      this.mainLight,
      this.fillLight
    );
  }

  /* ================================================================
     INITIAL EYEWEAR
  ================================================================= */

  private loadInitialEyewear(): void {
    this.eyewearModel =
      new EyewearModel();

    this.eyewearModel.group.name =
      "Eyewear_Root";

    this.scene.add(
      this.eyewearModel.group
    );

    this.prepareModel(
      this.eyewearModel.group
    );

    this.saveOriginalTransforms(
      this.eyewearModel.group
    );

    this.selectedObject =
      this.eyewearModel.group;

    this.focusObject(
      this.eyewearModel.group
    );
  }

  /* ================================================================
     MODEL PREPARATION
  ================================================================= */

  private prepareModel(
    root: THREE.Object3D
  ): void {
    root.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        child.castShadow = true;

        child.receiveShadow = true;

        child.frustumCulled = true;

        if (
          child.geometry
        ) {
          child.geometry.computeBoundingBox();

          child.geometry.computeBoundingSphere();
        }

        if (child.material) {
          this.originalMaterials.set(
            child,
            this.cloneMaterialReference(
              child.material
            )
          );
        }
      }
    );

    root.updateMatrixWorld(true);
  }

  /* ================================================================
     MATERIAL HELPERS
  ================================================================= */

  private cloneMaterialReference(
    material:
      | THREE.Material
      | THREE.Material[]
  ):
    | THREE.Material
    | THREE.Material[] {
    if (Array.isArray(material)) {
      return material.map(
        (item) => item
      );
    }

    return material;
  }

  private getMeshMaterial(
    nodeName: string
  ):
    | THREE.MeshStandardMaterial
    | THREE.MeshPhysicalMaterial
    | null {
    const object =
      this.scene.getObjectByName(
        nodeName
      );

    if (
      !object ||
      !(object instanceof THREE.Mesh)
    ) {
      return null;
    }

    const material =
      Array.isArray(object.material)
        ? object.material[0]
        : object.material;

    if (
      material instanceof
        THREE.MeshStandardMaterial ||
      material instanceof
        THREE.MeshPhysicalMaterial
    ) {
      return material;
    }

    return null;
  }

  /* ================================================================
     SELECTION
  ================================================================= */

  public selectObject(
    object: THREE.Object3D | null
  ): void {
    if (this.disposed) {
      return;
    }

    this.selectedObject =
      object;

    if (object) {
      this.transformControls.attach(
        object
      );
    } else {
      this.transformControls.detach();
    }

    this.emit(
      "selectionChanged",
      object
    );
  }

  public selectObjectByName(
    name: string
  ): THREE.Object3D | null {
    if (!name) {
      this.clearSelection();

      return null;
    }

    /*
     * IMPORTANT:
     * The previous implementation incorrectly
     * referenced an undefined `id`.
     *
     * We correctly search by object name.
     */
    const object =
      this.scene.getObjectByName(
        name
      ) ?? null;

    this.selectObject(
      object
    );

    return object;
  }

  public clearSelection(): void {
    this.selectedObject = null;

    this.transformControls.detach();

    this.emit(
      "selectionChanged",
      null
    );
  }

  /* ================================================================
     TRANSFORM CONTROLS
  ================================================================= */

  public setTransformMode(
    mode: TransformMode
  ): void {
    this.transformControls.setMode(
      mode
    );
  }

  public setTransformSpace(
    space: TransformSpace
  ): void {
    this.transformControls.setSpace(
      space
    );
  }

  public setTransformSnap(
    translation?: number | null,
    rotation?: number | null,
    scale?: number | null
  ): void {
    this.transformControls.setTranslationSnap(
      translation ?? null
    );

    this.transformControls.setRotationSnap(
      rotation ?? null
    );

    this.transformControls.setScaleSnap(
      scale ?? null
    );
  }

  /* ================================================================
     CAMERA / FOCUS
  ================================================================= */

  private focusObject(
    object: THREE.Object3D
  ): void {
    object.updateMatrixWorld(true);

    this.box.setFromObject(
      object
    );

    if (this.box.isEmpty()) {
      this.controls.target.set(
        0,
        0,
        0
      );

      this.camera.position.set(
        0,
        20,
        100
      );

      this.controls.update();

      return;
    }

    this.box.getCenter(
      this.boxCenter
    );

    this.box.getSize(
      this.boxSize
    );

    const maxDimension =
      Math.max(
        this.boxSize.x,
        this.boxSize.y,
        this.boxSize.z,
        0.001
      );

    const fovRadians =
      THREE.MathUtils.degToRad(
        this.camera.fov
      );

    const distance =
      maxDimension /
      (2 *
        Math.tan(
          fovRadians / 2
        ));

    const finalDistance =
      Math.max(
        distance * 1.65,
        0.5
      );

    /*
     * Use current camera direction
     * instead of hard-coded Z direction.
     */
    this.cameraDirection
      .subVectors(
        this.camera.position,
        this.controls.target
      )
      .normalize();

    if (
      this.cameraDirection.lengthSq() <
      0.0001
    ) {
      this.cameraDirection.set(
        0,
        0,
        1
      );
    }

    this.controls.target.copy(
      this.boxCenter
    );

    this.camera.position
      .copy(this.boxCenter)
      .add(
        this.cameraDirection.multiplyScalar(
          finalDistance
        )
      );

    this.camera.near =
      Math.max(
        finalDistance / 1000,
        0.001
      );

    this.camera.far =
      Math.max(
        finalDistance * 100,
        1000
      );

    this.camera.updateProjectionMatrix();

    this.controls.update();
  }

  public focusSelectedObject(): void {
    if (this.selectedObject) {
      this.focusObject(
        this.selectedObject
      );

      return;
    }

    if (this.importedModel) {
      this.focusObject(
        this.importedModel
      );

      return;
    }

    if (
      this.eyewearModel?.group
    ) {
      this.focusObject(
        this.eyewearModel.group
      );

      return;
    }

    this.controls.target.set(
      0,
      0,
      0
    );

    this.camera.position.set(
      0,
      20,
      100
    );

    this.controls.update();
  }

  public resetCamera(): void {
    this.controls.target.set(
      0,
      0,
      0
    );

    this.camera.position.set(
      0,
      20,
      100
    );

    this.camera.near = 0.01;

    this.camera.far = 5000;

    this.camera.updateProjectionMatrix();

    this.controls.update();
  }

  /* ================================================================
     AUTO ROTATION
  ================================================================= */

  public setAutoRotate(
    enabled: boolean
  ): void {
    this.autoRotateEnabled =
      enabled;

    this.controls.autoRotate =
      enabled;

    this.controls.autoRotateSpeed =
      2;
  }

  public getAutoRotate(): boolean {
    return this.autoRotateEnabled;
  }

  /* ================================================================
     GLTF / GLB IMPORT
  ================================================================= */

  public async importGLTF(
    source:
      | string
      | ArrayBuffer
      | Blob,
    options: ModelLoadOptions = {}
  ): Promise<THREE.Group> {
    if (this.disposed) {
      throw new Error(
        "Cannot import model after engine disposal."
      );
    }

    const loader =
      new GLTFLoader();

    let gltf: {
      scene: THREE.Group;
    };

    if (
      typeof source === "string"
    ) {
      gltf =
        await loader.loadAsync(
          source
        );
    } else {
      const arrayBuffer =
        source instanceof Blob
          ? await source.arrayBuffer()
          : source;

      gltf =
        await loader.parseAsync(
          arrayBuffer,
          ""
        );
    }

    const model =
      gltf.scene;

    model.name =
      options.name ??
      model.name ??
      "Imported_Eyewear_Model";

    this.prepareModel(
      model
    );

    if (
      options.center !== false
    ) {
      this.centerObject(
        model
      );
    }

    this.removeImportedModel();

    /*
     * Hide the procedural placeholder
     * once the generated model arrives.
     */
    if (
      this.eyewearModel?.group
    ) {
      this.eyewearModel.group.visible =
        false;
    }

    this.importedModel =
      model;

    this.scene.add(
      model
    );

    this.saveOriginalTransforms(
      model
    );

    if (
      options.fitCamera !== false
    ) {
      this.focusObject(
        model
      );
    }

    if (
      options.select !== false
    ) {
      this.selectObject(
        model
      );
    }

    this.emit(
      "modelLoaded",
      model
    );

    return model;
  }

  public async importGLB(
    source:
      | string
      | ArrayBuffer
      | Blob,
    options: ModelLoadOptions = {}
  ): Promise<THREE.Group> {
    return this.importGLTF(
      source,
      options
    );
  }

  public async importGLTFFile(
    file: File,
    options: ModelLoadOptions = {}
  ): Promise<THREE.Group> {
    if (!file) {
      throw new Error(
        "No GLTF/GLB file provided."
      );
    }

    return this.importGLTF(
      file,
      options
    );
  }

  public async importGLBFile(
    file: File,
    options: ModelLoadOptions = {}
  ): Promise<THREE.Group> {
    return this.importGLTFFile(
      file,
      options
    );
  }

  /* ================================================================
     IMPORTED MODEL MANAGEMENT
  ================================================================= */

  public removeImportedModel(): void {
    if (!this.importedModel) {
      return;
    }

    const oldModel =
      this.importedModel;

    this.transformControls.detach();

    if (
      this.selectedObject ===
      oldModel
    ) {
      this.selectedObject = null;
    }

    this.scene.remove(
      oldModel
    );

    this.disposeObject(
      oldModel
    );

    this.importedModel =
      null;

    this.emit(
      "modelRemoved",
      oldModel
    );
  }

  public removeModel(): void {
    this.removeImportedModel();

    if (
      this.eyewearModel?.group
    ) {
      this.eyewearModel.group.visible =
        true;
    }

    this.clearSelection();
  }

  public getImportedModel():
    THREE.Group | null {
    return this.importedModel;
  }

  public getActiveModel():
    THREE.Object3D | null {
    return (
      this.importedModel ??
      this.eyewearModel?.group ??
      null
    );
  }

  /* ================================================================
     CENTERING
  ================================================================= */

  public centerSelectedObject(): void {
    if (
      this.selectedObject
    ) {
      this.centerObject(
        this.selectedObject
      );
    }
  }

  private centerObject(
    object: THREE.Object3D
  ): void {
    object.updateMatrixWorld(true);

    this.box.setFromObject(
      object
    );

    if (
      this.box.isEmpty()
    ) {
      return;
    }

    this.box.getCenter(
      this.boxCenter
    );

    /*
     * Correct world-space centering.
     * For normal product models this gives
     * predictable studio positioning.
     */
    object.position.sub(
      this.boxCenter
    );

    object.updateMatrixWorld(
      true
    );
  }

  /* ================================================================
     MATERIAL COLOR
  ================================================================= */

  public getSelectedNodeColor(
    nodeName: string
  ): string {
    const material =
      this.getMeshMaterial(
        nodeName
      );

    if (!material) {
      return "#ffffff";
    }

    return `#${material.color.getHexString()}`;
  }

  public setNodeColor(
    nodeName: string,
    colorHex: string
  ): void {
    const object =
      this.scene.getObjectByName(
        nodeName
      );

    if (
      !object ||
      !(object instanceof THREE.Mesh)
    ) {
      return;
    }

    const materials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];

    for (
      const material of materials
    ) {
      if (
        "color" in material &&
        material.color instanceof
          THREE.Color
      ) {
        material.color.set(
          colorHex
        );

        material.needsUpdate =
          true;
      }
    }
  }

  /* ================================================================
     MATERIAL PRESETS
  ================================================================= */

  public applyMaterialPreset(
    objectName: string,
    preset: MaterialPreset
  ): void {
    const object =
      this.scene.getObjectByName(
        objectName
      );

    if (
      !object ||
      !(object instanceof THREE.Mesh)
    ) {
      return;
    }

    let material:
      | THREE.MeshPhysicalMaterial
      | THREE.MeshStandardMaterial;

    if (
      object.material instanceof
      THREE.MeshPhysicalMaterial
    ) {
      material =
        object.material;
    } else if (
      object.material instanceof
      THREE.MeshStandardMaterial
    ) {
      material =
        object.material;
    } else {
      material =
        new THREE.MeshPhysicalMaterial();

      object.material =
        material;
    }

    switch (preset) {
      case "gold":
        material.color.set(
          "#FFD700"
        );
        material.metalness =
          0.95;
        material.roughness =
          0.18;
        material.transparent =
          false;
        material.opacity = 1;
        break;

      case "chrome":
        material.color.set(
          "#E5E7EB"
        );
        material.metalness =
          1;
        material.roughness =
          0.08;
        material.transparent =
          false;
        material.opacity = 1;
        break;

      case "silver":
        material.color.set(
          "#D1D5DB"
        );
        material.metalness =
          0.95;
        material.roughness =
          0.18;
        material.transparent =
          false;
        material.opacity = 1;
        break;

      case "mattePlastic":
        material.color.set(
          "#222222"
        );
        material.metalness =
          0;
        material.roughness =
          0.82;
        material.transparent =
          false;
        material.opacity = 1;
        break;

      case "glossyPlastic":
        material.color.set(
          "#111111"
        );
        material.metalness =
          0.12;
        material.roughness =
          0.12;
        material.transparent =
          false;
        material.opacity = 1;
        break;

      case "tintedGlass":
        material.color.set(
          "#243B53"
        );
        material.metalness =
          0;
        material.roughness =
          0.05;
        material.transparent =
          true;
        material.opacity =
          0.65;

        if (
          material instanceof
          THREE.MeshPhysicalMaterial
        ) {
          material.transmission =
            0.92;

          material.ior =
            1.5;

          material.thickness =
            0.8;

          material.attenuationColor.set(
            "#26384A"
          );

          material.attenuationDistance =
            2;
        }

        break;

      case "blackGlass":
        material.color.set(
          "#050505"
        );
        material.metalness =
          0.15;
        material.roughness =
          0.04;
        material.transparent =
          true;
        material.opacity =
          0.72;

        if (
          material instanceof
          THREE.MeshPhysicalMaterial
        ) {
          material.transmission =
            0.75;

          material.ior =
            1.5;

          material.thickness =
            0.8;
        }

        break;
    }

    material.needsUpdate =
      true;
  }

  /* ================================================================
     RENDER STYLE
  ================================================================= */

  public setRenderStyle(
    style: RenderStyle
  ): void {
    if (
      this.currentRenderStyle ===
      style
    ) {
      return;
    }

    /*
     * Restore original materials first.
     * This prevents clay/wireframe mode from
     * permanently destroying the user's materials.
     */
    this.restoreRenderMaterials();

    this.currentRenderStyle =
      style;

    if (
      style === "default"
    ) {
      return;
    }

    const root =
      this.getActiveModel();

    if (!root) {
      return;
    }

    root.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        if (
          !this.renderStyleMaterials.has(
            child
          )
        ) {
          this.renderStyleMaterials.set(
            child,
            this.cloneMaterialReference(
              child.material
            )
          );
        }

        const materials =
          Array.isArray(child.material)
            ? child.material
            : [child.material];

        materials.forEach(
          (material) => {
            if (
              !(
                material instanceof
                  THREE.MeshStandardMaterial ||
                material instanceof
                  THREE.MeshPhysicalMaterial ||
                material instanceof
                  THREE.MeshBasicMaterial
              )
            ) {
              return;
            }

            if (
              style === "wireframe"
            ) {
              material.wireframe =
                true;
            }

            if (
              style === "clay"
            ) {
              material.color.set(
                "#CCCCCC"
              );

              if (
                "roughness" in
                material
              ) {
                material.roughness =
                  0.9;
              }

              if (
                "metalness" in
                material
              ) {
                material.metalness =
                  0;
              }

              material.wireframe =
                false;
            }

            material.needsUpdate =
              true;
          }
        );
      }
    );
  }

  private restoreRenderMaterials(): void {
    this.renderStyleMaterials.forEach(
      (material, mesh) => {
        mesh.material =
          material;

        const materials =
          Array.isArray(material)
            ? material
            : [material];

        materials.forEach(
          (item) => {
            if (
              "wireframe" in item
            ) {
              (
                item as
                  THREE.Material & {
                    wireframe?: boolean;
                  }
              ).wireframe =
                false;
            }

            item.needsUpdate =
              true;
          }
        );
      }
    );

    this.renderStyleMaterials.clear();
  }

  public getRenderStyle():
    RenderStyle {
    return this.currentRenderStyle;
  }

  /* ================================================================
     EXPLODED VIEW
  ================================================================= */

  public setExplodeAmount(
    amount: number
  ): void {
    const root =
      this.eyewearModel?.group;

    if (!root) {
      return;
    }

    const normalized =
      THREE.MathUtils.clamp(
        amount,
        0,
        5
      );

    root.traverse(
      (child) => {
        if (
          !(
            child instanceof
            THREE.Mesh
          )
        ) {
          return;
        }

        const name =
          child.name.toLowerCase();

        const original =
          this.originalTransforms.get(
            child
          );

        if (!original) {
          return;
        }

        child.position.copy(
          original.position
        );

        if (
          name.includes("left")
        ) {
          child.position.x -=
            normalized * 15;
        } else if (
          name.includes("right")
        ) {
          child.position.x +=
            normalized * 15;
        } else if (
          name.includes("bridge")
        ) {
          child.position.z +=
            normalized * 10;
        }
      }
    );
  }

  /* ================================================================
     LIGHTING
  ================================================================= */

  public setLightingPreset(
    preset: LightingPreset
  ): void {
    const presets: Record<
      LightingPreset,
      {
        ambient: number;
        mainColor: number;
        mainIntensity: number;
        fillColor: number;
        fillIntensity: number;
      }
    > = {
      studio: {
        ambient: 1.2,
        mainColor: 0xffffff,
        mainIntensity: 2.4,
        fillColor: 0xffffff,
        fillIntensity: 1.2,
      },

      warm: {
        ambient: 1,
        mainColor: 0xffe6cc,
        mainIntensity: 2.6,
        fillColor: 0xffcc99,
        fillIntensity: 1.1,
      },

      cool: {
        ambient: 1,
        mainColor: 0xccf2ff,
        mainIntensity: 2.4,
        fillColor: 0x99e6ff,
        fillIntensity: 1.2,
      },

      dramatic: {
        ambient: 0.3,
        mainColor: 0xffffff,
        mainIntensity: 3.8,
        fillColor: 0x444444,
        fillIntensity: 0.5,
      },
    };

    const config =
      presets[preset];

    this.ambientLight.intensity =
      config.ambient;

    this.mainLight.color.setHex(
      config.mainColor
    );

    this.mainLight.intensity =
      config.mainIntensity;

    this.fillLight.color.setHex(
      config.fillColor
    );

    this.fillLight.intensity =
      config.fillIntensity;

    this.currentLightingPreset =
      preset;
  }

  public setLightIntensity(
    intensity: number
  ): void {
    this.mainLight.intensity =
      THREE.MathUtils.clamp(
        intensity,
        0,
        10
      );
  }

  public getLightingPreset():
    LightingPreset {
    return this.currentLightingPreset;
  }

  /* ================================================================
     BACKGROUND
  ================================================================= */

  public setBackgroundColor(
    colorHex: string
  ): void {
    this.scene.background =
      new THREE.Color(
        colorHex
      );
  }

  /* ================================================================
     REFERENCE IMAGES
  ================================================================= */

  public addReferenceImage(
    file: File,
    options: ReferencePlaneOptions = {}
  ): Promise<THREE.Mesh> {
    return new Promise(
      (resolve, reject) => {
        if (this.disposed) {
          reject(
            new Error(
              "Engine has already been disposed."
            )
          );

          return;
        }

        const url =
          URL.createObjectURL(
            file
          );

        const loader =
          new THREE.TextureLoader();

        loader.load(
          url,

          (texture) => {
            URL.revokeObjectURL(
              url
            );

            texture.colorSpace =
              THREE.SRGBColorSpace;

            const image =
              texture.image as
                HTMLImageElement;

            const aspect =
              image.width /
              Math.max(
                image.height,
                1
              );

            const height =
              options.height ??
              40;

            const width =
              options.width ??
              height * aspect;

            const geometry =
              new THREE.PlaneGeometry(
                width,
                height
              );

            const material =
              new THREE.MeshBasicMaterial(
                {
                  map: texture,
                  transparent: true,
                  opacity:
                    options.opacity ??
                    0.5,
                  depthWrite: false,
                  side: THREE.DoubleSide,
                }
              );

            const plane =
              new THREE.Mesh(
                geometry,
                material
              );

            plane.name =
              options.name ??
              `Reference_${Date.now()}`;

            plane.position.copy(
              options.position ??
                new THREE.Vector3(
                  0,
                  0,
                  -10
                )
            );

            plane.rotation.copy(
              options.rotation ??
                new THREE.Euler(
                  0,
                  0,
                  0
                )
            );

            plane.scale.setScalar(
              options.scale ?? 1
            );

            plane.renderOrder =
              10;

            this.referenceGroup.add(
              plane
            );

            resolve(plane);
          },

          undefined,

          (error) => {
            URL.revokeObjectURL(
              url
            );

            reject(error);
          }
        );
      }
    );
  }

  public clearReferenceImages(): void {
    while (
      this.referenceGroup
        .children.length
    ) {
      const child =
        this.referenceGroup
          .children[0];

      this.referenceGroup.remove(
        child
      );

      this.disposeObject(
        child
      );
    }
  }

  /* ================================================================
     SNAPSHOT
  ================================================================= */

  public captureSnapshot(
    filename =
      "eyecap_render.png"
  ): void {
    if (this.disposed) {
      return;
    }

    this.renderer.render(
      this.scene,
      this.camera
    );

    const dataURL =
      this.renderer.domElement.toDataURL(
        "image/png"
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      dataURL;

    link.download =
      filename;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();
  }

  public getSnapshotDataURL():
    string {
    this.renderer.render(
      this.scene,
      this.camera
    );

    return this.renderer.domElement.toDataURL(
      "image/png"
    );
  }

  /* ================================================================
     CONFIGURATION EXPORT
  ================================================================= */

  public exportConfigurationJSON():
    string {
    const configuration: Record<
      string,
      unknown
    > = {};

    const root =
      this.importedModel ??
      this.eyewearModel?.group;

    if (!root) {
      return JSON.stringify(
        configuration,
        null,
        2
      );
    }

    root.updateMatrixWorld(
      true
    );

    root.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        const materials =
          Array.isArray(child.material)
            ? child.material
            : [child.material];

        configuration[
          child.name ||
          `Mesh_${child.id}`
        ] = {
          uuid: child.uuid,

          position:
            child.position.toArray(),

          rotation: [
            child.rotation.x,
            child.rotation.y,
            child.rotation.z,
          ],

          scale:
            child.scale.toArray(),

          visible:
            child.visible,

          materials:
            materials.map(
              (material) => {
                const result: Record<
                  string,
                  unknown
                > = {
                  type:
                    material.type,
                };

                if (
                  "color" in
                    material &&
                  material.color instanceof
                    THREE.Color
                ) {
                  result.color =
                    `#${material.color.getHexString()}`;
                }

                if (
                  "roughness" in
                  material
                ) {
                  result.roughness =
                    (
                      material as
                        THREE.Material & {
                          roughness?: number;
                        }
                    ).roughness;
                }

                if (
                  "metalness" in
                  material
                ) {
                  result.metalness =
                    (
                      material as
                        THREE.Material & {
                          metalness?: number;
                        }
                    ).metalness;
                }

                if (
                  "opacity" in
                  material
                ) {
                  result.opacity =
                    (
                      material as
                        THREE.Material & {
                          opacity?: number;
                        }
                    ).opacity;
                }

                if (
                  "transmission" in
                  material
                ) {
                  result.transmission =
                    (
                      material as
                        THREE.Material & {
                          transmission?: number;
                        }
                    ).transmission;
                }

                return result;
              }
            ),
        };
      }
    );

    return JSON.stringify(
      configuration,
      null,
      2
    );
  }

  /* ================================================================
     MODEL EXPORT
  ================================================================= */

  public async exportModel(
    filename =
      "eyecap_model.glb"
  ): Promise<Blob | null> {
    const root =
      this.importedModel ??
      this.eyewearModel?.group;

    if (!root) {
      throw new Error(
        "No 3D model available for export."
      );
    }

    root.updateMatrixWorld(
      true
    );

    const exporter =
      new GLTFExporter();

    return new Promise(
      (resolve, reject) => {
        exporter.parse(
          root,

          (result) => {
            if (
              !(result instanceof
                ArrayBuffer)
            ) {
              reject(
                new Error(
                  "GLB exporter returned an unexpected format."
                )
              );

              return;
            }

            const blob =
              new Blob(
                [result],
                {
                  type:
                    "model/gltf-binary",
                }
              );

            /*
             * Download for Studio user.
             */
            const url =
              URL.createObjectURL(
                blob
              );

            const link =
              document.createElement(
                "a"
              );

            link.href =
              url;

            link.download =
              filename;

            document.body.appendChild(
              link
            );

            link.click();

            link.remove();

            window.setTimeout(
              () => {
                URL.revokeObjectURL(
                  url
                );
              },
              1000
            );

            resolve(blob);
          },

          (error) => {
            reject(
              error instanceof Error
                ? error
                : new Error(
                    "GLB export failed."
                  )
            );
          },

          {
            binary: true,
            onlyVisible: false,
          }
        );
      }
    );
  }

  /* ================================================================
     TRANSFORM SNAPSHOT
  ================================================================= */

  private saveOriginalTransforms(
    root: THREE.Object3D
  ): void {
    root.traverse(
      (child) => {
        this.originalTransforms.set(
          child,
          {
            position:
              child.position.clone(),

            rotation:
              child.rotation.clone(),

            scale:
              child.scale.clone(),
          }
        );
      }
    );
  }

  public resetSelectedTransform(): void {
    if (
      !this.selectedObject
    ) {
      return;
    }

    const original =
      this.originalTransforms.get(
        this.selectedObject
      );

    if (!original) {
      this.selectedObject.position.set(
        0,
        0,
        0
      );

      this.selectedObject.rotation.set(
        0,
        0,
        0
      );

      this.selectedObject.scale.set(
        1,
        1,
        1
      );

      return;
    }

    this.selectedObject.position.copy(
      original.position
    );

    this.selectedObject.rotation.copy(
      original.rotation
    );

    this.selectedObject.scale.copy(
      original.scale
    );

    this.selectedObject.updateMatrixWorld(
      true
    );
  }

  /* ================================================================
     STATS
  ================================================================= */

  public getStats():
    EngineStats {
    let triangles = 0;

    let geometries = 0;

    let textures = 0;

    let objects = 0;

    const geometrySet =
      new Set<THREE.BufferGeometry>();

    const textureSet =
      new Set<THREE.Texture>();

    this.scene.traverse(
      (object) => {
        objects++;

        if (
          object instanceof THREE.Mesh
        ) {
          geometrySet.add(
            object.geometry
          );

          const geometry =
            object.geometry;

          const position =
            geometry.getAttribute(
              "position"
            );

          if (position) {
            const index =
              geometry.index;

            triangles += index
              ? index.count / 3
              : position.count / 3;
          }

          const materials =
            Array.isArray(
              object.material
            )
              ? object.material
              : [object.material];

          materials.forEach(
            (material) => {
              const record =
                material as unknown as Record<
                  string,
                  unknown
                >;

              Object.values(
                record
              ).forEach(
                (value) => {
                  if (
                    value instanceof
                    THREE.Texture
                  ) {
                    textureSet.add(
                      value
                    );
                  }
                }
              );
            }
          );
        }
      }
    );

    geometries =
      geometrySet.size;

    textures =
      textureSet.size;

    return {
      fps:
        Math.round(
          this.currentFPS
        ),

      frameTime:
        Number(
          this.currentFrameTime.toFixed(
            2
          )
        ),

      triangles:
        Math.round(
          triangles
        ),

      geometries,

      textures,

      objects,
    };
  }

  /* ================================================================
     RESIZE
  ================================================================= */

  public resize(
    width: number,
    height: number
  ): void {
    if (
      this.disposed ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      width,
      height,
      false
    );

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        this.maxPixelRatio
      )
    );

    this.emit(
      "resize",
      width,
      height
    );
  }

  /* ================================================================
     EVENT SYSTEM
  ================================================================= */

  public on(
    event: EngineEventName,
    callback: EngineEventCallback
  ): () => void {
    if (
      !this.eventListeners.has(
        event
      )
    ) {
      this.eventListeners.set(
        event,
        new Set()
      );
    }

    const listeners =
      this.eventListeners.get(
        event
      )!;

    listeners.add(
      callback
    );

    return () => {
      listeners.delete(
        callback
      );
    };
  }

  private emit(
    event: EngineEventName,
    ...args: unknown[]
  ): void {
    const listeners =
      this.eventListeners.get(
        event
      );

    if (!listeners) {
      return;
    }

    listeners.forEach(
      (listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(
            `[EYECAP 3D] Event "${event}" listener failed:`,
            error
          );
        }
      }
    );
  }

  /* ================================================================
     RENDER LOOP
  ================================================================= */

  public start(): void {
    if (
      this.isRunning ||
      this.disposed
    ) {
      return;
    }

    this.isRunning = true;

    this.clock.start();

    this.lastFrameTime =
      performance.now();

    this.tick();
  }

  public stop(): void {
    this.isRunning = false;

    if (
      this.animationFrameId !== null
    ) {
      cancelAnimationFrame(
        this.animationFrameId
      );

      this.animationFrameId =
        null;
    }
  }

  public isStarted(): boolean {
    return this.isRunning;
  }

  private tick = (): void => {
    if (
      !this.isRunning ||
      this.disposed
    ) {
      return;
    }

    const now =
      performance.now();

    const delta =
      now -
      this.lastFrameTime;

    this.lastFrameTime =
      now;

    this.currentFrameTime =
      delta;

    /*
     * FPS calculation.
     */
    this.fpsAccumulator +=
      delta;

    this.fpsFrames++;

    if (
      this.fpsAccumulator >=
      500
    ) {
      this.currentFPS =
        (this.fpsFrames * 1000) /
        this.fpsAccumulator;

      this.fpsAccumulator =
        0;

      this.fpsFrames =
        0;
    }

    this.controls.update();

    this.renderer.render(
      this.scene,
      this.camera
    );

    this.animationFrameId =
      requestAnimationFrame(
        this.tick
      );
  };

  /* ================================================================
     OBJECT DISPOSAL
  ================================================================= */

  private disposeObject(
    object: THREE.Object3D
  ): void {
    const geometries =
      new Set<THREE.BufferGeometry>();

    const materials =
      new Set<THREE.Material>();

    const textures =
      new Set<THREE.Texture>();

    object.traverse(
      (child) => {
        if (
          child instanceof THREE.Mesh
        ) {
          geometries.add(
            child.geometry
          );

          const materialList =
            Array.isArray(
              child.material
            )
              ? child.material
              : [child.material];

          materialList.forEach(
            (material) => {
              materials.add(
                material
              );

              const record =
                material as unknown as Record<
                  string,
                  unknown
                >;

              Object.values(
                record
              ).forEach(
                (value) => {
                  if (
                    value instanceof
                    THREE.Texture
                  ) {
                    textures.add(
                      value
                    );
                  }
                }
              );
            }
          );
        }
      }
    );

    textures.forEach(
      (texture) => {
        texture.dispose();
      }
    );

    materials.forEach(
      (material) => {
        material.dispose();
      }
    );

    geometries.forEach(
      (geometry) => {
        geometry.dispose();
      }
    );
  }

  /* ================================================================
     DISPOSE ENGINE
  ================================================================= */

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    this.stop();

    this.transformControls.detach();

    this.transformControls.detach();

    if (
      this.transformControls &&
      typeof (this.transformControls as any).dispose === 'function'
    ) {
      try {
        (this.transformControls as any).dispose();
      } catch (error) {
        console.warn(
          '[EYECAP] TransformControls disposal skipped:',
          error
        );
      }
    }

    this.controls.dispose();

    this.clearReferenceImages();

    if (
      this.importedModel
    ) {
      this.scene.remove(
        this.importedModel
      );

      this.disposeObject(
        this.importedModel
      );

      this.importedModel =
        null;
    }

    if (
      this.eyewearModel?.group
    ) {
      this.scene.remove(
        this.eyewearModel.group
      );

      this.disposeObject(
        this.eyewearModel.group
      );
    }

    this.eventListeners.clear();

    this.originalMaterials.clear();

    this.renderStyleMaterials.clear();

    this.originalTransforms.clear();

    this.renderer.dispose();

    /*
     * Release WebGL resources.
     */
    try {
      this.renderer.forceContextLoss();
    } catch {
      // Browser may already have lost context.
    }

    this.emit(
      "disposed"
    );
  }
}