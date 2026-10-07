import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export interface ModelLoadOptions {
  /** Optional Draco decoder path. */
  dracoDecoderPath?: string;

  /** Optional KTX2 transcoder path. */
  ktx2TranscoderPath?: string;

  /** Renderer used for KTX2 capability detection. */
  renderer?: THREE.WebGLRenderer | null;

  /** Automatically center the loaded model. */
  center?: boolean;

  /** Normalize the largest model dimension to this size. */
  normalize?: boolean;

  /** Target size used when normalization is enabled. */
  targetSize?: number;

  /** Convert loaded meshes to frustum-culling friendly objects. */
  enableFrustumCulling?: boolean;

  /** Automatically update matrix state after loading. */
  updateMatrices?: boolean;
}

export interface ModelLoadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface LoadedModel {
  scene: THREE.Group;
  scenes: THREE.Group[];
  animations: THREE.AnimationClip[];
  cameras: THREE.Camera[];
  asset: unknown;
}

export interface ModelLoadResult {
  model: LoadedModel;
  source: string;
  durationMs: number;
  objectCount: number;
  meshCount: number;
  triangleCount: number;
}

export type ModelProgressCallback = (
  progress: ModelLoadProgress
) => void;

export type ModelErrorCallback = (
  error: Error
) => void;

/**
 * EYECAP 3D Studio
 *
 * Central GLTF / GLB loading layer.
 *
 * Responsibilities:
 * - Load .glb / .gltf models
 * - Configure Draco compression support
 * - Configure KTX2 texture support
 * - Report loading progress
 * - Cancel active requests
 * - Validate loaded scenes
 * - Prepare models for Three.js rendering
 * - Dispose models safely
 * - Provide model statistics
 *
 * This class does NOT own the Three.js Scene.
 * SceneManager remains responsible for scene ownership.
 */
export class ModelLoader {
  private readonly loader: GLTFLoader;

  private readonly dracoLoader: DRACOLoader;

  private ktx2Loader: KTX2Loader | null = null;

  private activeRequests = new Set<AbortController>();

  private disposed = false;

  private defaultOptions: Required<
    Pick<
      ModelLoadOptions,
      | 'center'
      | 'normalize'
      | 'targetSize'
      | 'enableFrustumCulling'
      | 'updateMatrices'
    >
  >;

  constructor(
    options: ModelLoadOptions = {}
  ) {
    this.loader = new GLTFLoader();

    this.dracoLoader = new DRACOLoader();

    this.defaultOptions = {
      center: options.center ?? false,
      normalize: options.normalize ?? false,
      targetSize: options.targetSize ?? 2,
      enableFrustumCulling:
        options.enableFrustumCulling ?? true,
      updateMatrices:
        options.updateMatrices ?? true,
    };

    if (options.dracoDecoderPath) {
      this.configureDraco(
        options.dracoDecoderPath
      );
    }

    if (
      options.ktx2TranscoderPath &&
      options.renderer
    ) {
      this.configureKTX2(
        options.ktx2TranscoderPath,
        options.renderer
      );
    }
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  public configureDraco(
    decoderPath: string
  ): void {
    if (this.disposed) {
      throw new Error(
        'ModelLoader has already been disposed.'
      );
    }

    this.dracoLoader.setDecoderPath(
      decoderPath
    );

    this.loader.setDRACOLoader(
      this.dracoLoader
    );
  }

  public configureKTX2(
    transcoderPath: string,
    renderer: THREE.WebGLRenderer
  ): void {
    if (this.disposed) {
      throw new Error(
        'ModelLoader has already been disposed.'
      );
    }

    if (!this.ktx2Loader) {
      this.ktx2Loader =
        new KTX2Loader();

      this.ktx2Loader.setTranscoderPath(
        transcoderPath
      );

      this.ktx2Loader.detectSupport(
        renderer
      );

      this.loader.setKTX2Loader(
        this.ktx2Loader
      );
    }
  }

  // ============================================================
  // LOAD
  // ============================================================

  public async load(
    source: string,
    options: ModelLoadOptions = {},
    onProgress?: ModelProgressCallback,
    onError?: ModelErrorCallback
  ): Promise<ModelLoadResult> {
    if (this.disposed) {
      throw new Error(
        'ModelLoader has already been disposed.'
      );
    }

    if (!source || typeof source !== 'string') {
      throw new Error(
        'ModelLoader.load(): a valid model URL/path is required.'
      );
    }

    const startedAt = performance.now();

    const mergedOptions = {
      ...this.defaultOptions,
      ...options,
    };

    const controller =
      new AbortController();

    this.activeRequests.add(controller);

    try {
      const gltf =
        await this.loadGLTF(
          source,
          onProgress,
          controller.signal
        );

      if (!gltf?.scene) {
        throw new Error(
          'The loaded GLTF/GLB does not contain a valid scene.'
        );
      }

      const prepared =
        this.prepareModel(
          gltf,
          mergedOptions
        );

      const statistics =
        this.getStatistics(
          prepared.scene
        );

      const result: ModelLoadResult = {
        model: prepared,
        source,
        durationMs:
          performance.now() -
          startedAt,
        objectCount:
          statistics.objectCount,
        meshCount:
          statistics.meshCount,
        triangleCount:
          statistics.triangleCount,
      };

      return result;
    } catch (error) {
      const normalizedError =
        this.normalizeError(error);

      onError?.(normalizedError);

      throw normalizedError;
    } finally {
      this.activeRequests.delete(
        controller
      );
    }
  }

  // ============================================================
  // GLTF LOADER
  // ============================================================

  private loadGLTF(
    source: string,
    onProgress?: ModelProgressCallback,
    signal?: AbortSignal
  ): Promise<LoadedModel> {
    return new Promise(
      (resolve, reject) => {
        if (signal?.aborted) {
          reject(
            new DOMException(
              'Model loading was cancelled.',
              'AbortError'
            )
          );

          return;
        }

        const abortHandler = () => {
          reject(
            new DOMException(
              'Model loading was cancelled.',
              'AbortError'
            )
          );
        };

        signal?.addEventListener(
          'abort',
          abortHandler,
          {
            once: true,
          }
        );

        this.loader.load(
          source,

          (gltf) => {
            signal?.removeEventListener(
              'abort',
              abortHandler
            );

            resolve({
              scene: gltf.scene,
              scenes: gltf.scenes,
              animations: gltf.animations,
              cameras: gltf.cameras,
              asset: gltf.asset,
            });
          },

          (event) => {
            if (!onProgress) {
              return;
            }

            const loaded =
              event.loaded ?? 0;

            const total =
              event.total ?? 0;

            const percent =
              total > 0
                ? Math.min(
                    100,
                    (loaded / total) * 100
                  )
                : 0;

            onProgress({
              loaded,
              total,
              percent,
            });
          },

          (error) => {
            signal?.removeEventListener(
              'abort',
              abortHandler
            );

            reject(error);
          }
        );
      }
    );
  }

  // ============================================================
  // MODEL PREPARATION
  // ============================================================

  private prepareModel(
    model: LoadedModel,
    options: Required<
      Pick<
        ModelLoadOptions,
        | 'center'
        | 'normalize'
        | 'targetSize'
        | 'enableFrustumCulling'
        | 'updateMatrices'
      >
    >
  ): LoadedModel {
    const root = model.scene;

    root.traverse(
      (object) => {
        const mesh =
          object as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        mesh.frustumCulled =
          options.enableFrustumCulling;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.prepareGeometry(mesh);
        this.prepareMaterial(mesh);
      }
    );

    if (options.normalize) {
      this.normalizeModel(
        root,
        options.targetSize
      );
    }

    if (options.center) {
      this.centerModel(root);
    }

    if (options.updateMatrices) {
      root.updateMatrixWorld(true);
    }

    return model;
  }

  // ============================================================
  // GEOMETRY
  // ============================================================

  private prepareGeometry(
    mesh: THREE.Mesh
  ): void {
    const geometry =
      mesh.geometry;

    if (!geometry) {
      return;
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    /*
     * Do not force normal/tangent generation here.
     *
     * GLB assets may already contain optimized
     * normals/tangents and recalculating them can
     * unnecessarily increase loading time.
     */
  }

  // ============================================================
  // MATERIAL
  // ============================================================

  private prepareMaterial(
    mesh: THREE.Mesh
  ): void {
    const material =
      mesh.material;

    if (!material) {
      return;
    }

    if (Array.isArray(material)) {
      for (const mat of material) {
        this.prepareSingleMaterial(mat);
      }

      return;
    }

    this.prepareSingleMaterial(
      material
    );
  }

  private prepareSingleMaterial(
    material: THREE.Material
  ): void {
    material.needsUpdate = false;
  }

  // ============================================================
  // CENTER MODEL
  // ============================================================

  public centerModel(
    object: THREE.Object3D
  ): THREE.Vector3 {
    const box =
      new THREE.Box3().setFromObject(
        object
      );

    if (box.isEmpty()) {
      return new THREE.Vector3();
    }

    const center =
      new THREE.Vector3();

    box.getCenter(center);

    object.position.sub(center);

    object.updateMatrixWorld(true);

    return center;
  }

  // ============================================================
  // NORMALIZE MODEL
  // ============================================================

  public normalizeModel(
    object: THREE.Object3D,
    targetSize = 2
  ): number {
    if (
      !Number.isFinite(targetSize) ||
      targetSize <= 0
    ) {
      throw new Error(
        'targetSize must be greater than zero.'
      );
    }

    const box =
      new THREE.Box3().setFromObject(
        object
      );

    if (box.isEmpty()) {
      return 1;
    }

    const size =
      new THREE.Vector3();

    box.getSize(size);

    const largestDimension =
      Math.max(
        size.x,
        size.y,
        size.z
      );

    if (
      !Number.isFinite(
        largestDimension
      ) ||
      largestDimension <= 0
    ) {
      return 1;
    }

    const scale =
      targetSize /
      largestDimension;

    object.scale.multiplyScalar(
      scale
    );

    object.updateMatrixWorld(true);

    return scale;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  public getStatistics(
    root: THREE.Object3D
  ): {
    objectCount: number;
    meshCount: number;
    triangleCount: number;
    vertexCount: number;
    materialCount: number;
    textureCount: number;
  } {
    let objectCount = 0;
    let meshCount = 0;
    let triangleCount = 0;
    let vertexCount = 0;

    const materials =
      new Set<THREE.Material>();

    const textures =
      new Set<THREE.Texture>();

    root.traverse(
      (object) => {
        objectCount++;

        const mesh =
          object as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        meshCount++;

        const geometry =
          mesh.geometry;

        if (geometry) {
          const position =
            geometry.getAttribute(
              'position'
            );

          if (position) {
            vertexCount +=
              position.count;
          }

          if (geometry.index) {
            triangleCount +=
              geometry.index.count /
              3;
          } else if (position) {
            triangleCount +=
              position.count / 3;
          }
        }

        const material =
          mesh.material;

        if (Array.isArray(material)) {
          for (const mat of material) {
            materials.add(mat);
            this.collectTextures(
              mat,
              textures
            );
          }
        } else if (material) {
          materials.add(material);
          this.collectTextures(
            material,
            textures
          );
        }
      }
    );

    return {
      objectCount,
      meshCount,
      triangleCount,
      vertexCount,
      materialCount:
        materials.size,
      textureCount:
        textures.size,
    };
  }

  // ============================================================
  // TEXTURE COLLECTION
  // ============================================================

  private collectTextures(
    material: THREE.Material,
    textures: Set<THREE.Texture>
  ): void {
    const materialRecord =
      material as unknown as Record<
        string,
        unknown
      >;

    for (const value of Object.values(
      materialRecord
    )) {
      if (
        value &&
        typeof value === 'object' &&
        'isTexture' in value &&
        (value as THREE.Texture)
          .isTexture
      ) {
        textures.add(
          value as THREE.Texture
        );
      }
    }
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  public validate(
    root: THREE.Object3D
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!root) {
      errors.push(
        'Model root is missing.'
      );

      return {
        valid: false,
        errors,
        warnings,
      };
    }

    let meshFound = false;

    root.traverse(
      (object) => {
        const mesh =
          object as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        meshFound = true;

        if (!mesh.geometry) {
          errors.push(
            `Mesh "${mesh.name || mesh.uuid}" has no geometry.`
          );
        }

        if (!mesh.material) {
          warnings.push(
            `Mesh "${mesh.name || mesh.uuid}" has no material.`
          );
        }
      }
    );

    if (!meshFound) {
      errors.push(
        'The model contains no renderable meshes.'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================
  // CANCEL
  // ============================================================

  public cancelAll(): void {
    for (const controller of this.activeRequests) {
      controller.abort();
    }

    this.activeRequests.clear();
  }

  public getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  // ============================================================
  // DISPOSE MODEL
  // ============================================================

  public disposeModel(
    root: THREE.Object3D
  ): void {
    if (!root) {
      return;
    }

    root.traverse(
      (object) => {
        const mesh =
          object as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        if (mesh.geometry) {
          mesh.geometry.dispose();
        }

        this.disposeMaterial(
          mesh.material
        );
      }
    );

    if (root.parent) {
      root.parent.remove(root);
    }
  }

  private disposeMaterial(
    material:
      | THREE.Material
      | THREE.Material[]
  ): void {
    if (Array.isArray(material)) {
      for (const mat of material) {
        this.disposeMaterial(mat);
      }

      return;
    }

    const record =
      material as unknown as Record<
        string,
        unknown
      >;

    for (const value of Object.values(
      record
    )) {
      if (
        value &&
        typeof value === 'object' &&
        'isTexture' in value &&
        (value as THREE.Texture)
          .isTexture
      ) {
        (
          value as THREE.Texture
        ).dispose();
      }
    }

    material.dispose();
  }

  // ============================================================
  // ERROR NORMALIZATION
  // ============================================================

  private normalizeError(
    error: unknown
  ): Error {
    if (error instanceof Error) {
      return error;
    }

    if (
      typeof error === 'string'
    ) {
      return new Error(error);
    }

    return new Error(
      'Unknown error occurred while loading the 3D model.'
    );
  }

  // ============================================================
  // DISPOSE LOADER
  // ============================================================

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.cancelAll();

    this.dracoLoader.dispose();

    this.ktx2Loader?.dispose();

    this.ktx2Loader = null;

    this.disposed = true;
  }

  public isDisposed(): boolean {
    return this.disposed;
  }
}

export default ModelLoader;