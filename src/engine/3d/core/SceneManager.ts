import * as THREE from 'three';

export type SceneObject = THREE.Object3D;

export interface SceneManagerOptions {
  backgroundColor?: THREE.ColorRepresentation;
  enableGrid?: boolean;
  gridSize?: number;
  gridDivisions?: number;
  enableAxes?: boolean;
  enableDefaultLighting?: boolean;
  enableEnvironment?: boolean;
}

export interface SceneSnapshot {
  objectCount: number;
  meshCount: number;
  triangleCount: number;
  selectedObjectId: string | null;
  sceneReady: boolean;
}

export class SceneManager {
  public readonly scene: THREE.Scene;

  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.Camera | null = null;

  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;

  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;

  private selectedObject: THREE.Object3D | null = null;

  private readonly modelRoot: THREE.Group;
  private readonly helperRoot: THREE.Group;
  private readonly environmentRoot: THREE.Group;

  private initialized = false;

  private options: Required<SceneManagerOptions>;

  constructor(options: SceneManagerOptions = {}) {
    this.options = {
      backgroundColor: options.backgroundColor ?? 0x09090b,
      enableGrid: options.enableGrid ?? true,
      gridSize: options.gridSize ?? 20,
      gridDivisions: options.gridDivisions ?? 20,
      enableAxes: options.enableAxes ?? false,
      enableDefaultLighting: options.enableDefaultLighting ?? true,
      enableEnvironment: options.enableEnvironment ?? false,
    };

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(
      this.options.backgroundColor
    );

    this.modelRoot = new THREE.Group();
    this.modelRoot.name = 'EYECAP_MODEL_ROOT';

    this.helperRoot = new THREE.Group();
    this.helperRoot.name = 'EYECAP_HELPERS';

    this.environmentRoot = new THREE.Group();
    this.environmentRoot.name = 'EYECAP_ENVIRONMENT';

    this.scene.add(this.environmentRoot);
    this.scene.add(this.modelRoot);
    this.scene.add(this.helperRoot);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  public initialize(
    renderer?: THREE.WebGLRenderer,
    camera?: THREE.Camera
  ): void {
    if (renderer) {
      this.renderer = renderer;
    }

    if (camera) {
      this.camera = camera;
    }

    if (this.initialized) {
      return;
    }

    this.setupEnvironment();
    this.setupHelpers();

    if (this.options.enableDefaultLighting) {
      this.setupLighting();
    }

    this.initialized = true;
  }

  // ============================================================
  // RENDERER / CAMERA
  // ============================================================

  public setRenderer(
    renderer: THREE.WebGLRenderer | null
  ): void {
    this.renderer = renderer;
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  public setCamera(
    camera: THREE.Camera | null
  ): void {
    this.camera = camera;
  }

  public getCamera(): THREE.Camera | null {
    return this.camera;
  }

  // ============================================================
  // MODEL ROOT
  // ============================================================

  public getModelRoot(): THREE.Group {
    return this.modelRoot;
  }

  public addModel(
    object: THREE.Object3D
  ): THREE.Object3D {
    if (!object) {
      throw new Error('SceneManager.addModel(): object is required.');
    }

    this.modelRoot.add(object);

    return object;
  }

  public removeModel(
    object: THREE.Object3D
  ): boolean {
    if (!object) {
      return false;
    }

    if (!this.modelRoot.children.includes(object)) {
      return false;
    }

    this.modelRoot.remove(object);

    this.disposeObject(object);

    if (this.selectedObject === object) {
      this.clearSelection();
    }

    return true;
  }

  public clearModels(): void {
    const objects = [...this.modelRoot.children];

    for (const object of objects) {
      this.modelRoot.remove(object);
      this.disposeObject(object);
    }

    this.clearSelection();
  }

  public getModels(): THREE.Object3D[] {
    return [...this.modelRoot.children];
  }

  // ============================================================
  // SELECTION
  // ============================================================

  public selectObject(
    object: THREE.Object3D | null
  ): void {
    if (object === this.selectedObject) {
      return;
    }

    this.clearSelection();

    if (!object) {
      return;
    }

    this.selectedObject = object;

    object.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      const material = mesh.material;

      if (Array.isArray(material)) {
        material.forEach((mat) => {
          this.enableSelectionState(mat, true);
        });
      } else if (material) {
        this.enableSelectionState(material, true);
      }
    });
  }

  public clearSelection(): void {
    if (!this.selectedObject) {
      return;
    }

    this.selectedObject.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      const material = mesh.material;

      if (Array.isArray(material)) {
        material.forEach((mat) => {
          this.enableSelectionState(mat, false);
        });
      } else if (material) {
        this.enableSelectionState(material, false);
      }
    });

    this.selectedObject = null;
  }

  public getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject;
  }

  private enableSelectionState(
    material: THREE.Material,
    selected: boolean
  ): void {
    const mat = material as THREE.Material & {
      emissive?: THREE.Color;
      emissiveIntensity?: number;
    };

    if (
      mat.emissive &&
      typeof mat.emissiveIntensity === 'number'
    ) {
      mat.emissiveIntensity = selected ? 0.12 : 0;
    }

    material.needsUpdate = true;
  }

  // ============================================================
  // ENVIRONMENT
  // ============================================================

  private setupEnvironment(): void {
    if (!this.options.enableEnvironment) {
      return;
    }

    const environment = new THREE.Group();
    environment.name = 'STUDIO_ENVIRONMENT';

    this.environmentRoot.add(environment);
  }

  public setBackground(
    color: THREE.ColorRepresentation
  ): void {
    this.scene.background = new THREE.Color(color);
  }

  public getBackground(): THREE.Color | null {
    if (this.scene.background instanceof THREE.Color) {
      return this.scene.background;
    }

    return null;
  }

  // ============================================================
  // GRID
  // ============================================================

  private setupHelpers(): void {
    if (this.options.enableGrid) {
      this.createGrid();
    }

    if (this.options.enableAxes) {
      this.createAxes();
    }
  }

  private createGrid(): void {
    if (this.gridHelper) {
      this.helperRoot.remove(this.gridHelper);
    }

    this.gridHelper = new THREE.GridHelper(
      this.options.gridSize,
      this.options.gridDivisions,
      0x444444,
      0x222222
    );

    this.gridHelper.name = 'EYECAP_GRID';

    this.helperRoot.add(this.gridHelper);
  }

  private createAxes(): void {
    if (this.axesHelper) {
      this.helperRoot.remove(this.axesHelper);
    }

    this.axesHelper = new THREE.AxesHelper(3);
    this.axesHelper.name = 'EYECAP_AXES';

    this.helperRoot.add(this.axesHelper);
  }

  public setGridVisible(
    visible: boolean
  ): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  public isGridVisible(): boolean {
    return this.gridHelper?.visible ?? false;
  }

  public setAxesVisible(
    visible: boolean
  ): void {
    if (this.axesHelper) {
      this.axesHelper.visible = visible;
    }
  }

  // ============================================================
  // LIGHTING
  // ============================================================

  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.5
    );

    this.ambientLight.name = 'EYECAP_AMBIENT_LIGHT';

    this.keyLight = new THREE.DirectionalLight(
      0xffffff,
      3
    );

    this.keyLight.name = 'EYECAP_KEY_LIGHT';

    this.keyLight.position.set(
      4,
      7,
      5
    );

    this.keyLight.castShadow = true;

    this.fillLight = new THREE.DirectionalLight(
      0x9bbcff,
      1.5
    );

    this.fillLight.name = 'EYECAP_FILL_LIGHT';

    this.fillLight.position.set(
      -5,
      3,
      2
    );

    this.rimLight = new THREE.DirectionalLight(
      0xd7b5ff,
      2
    );

    this.rimLight.name = 'EYECAP_RIM_LIGHT';

    this.rimLight.position.set(
      0,
      5,
      -6
    );

    this.scene.add(this.ambientLight);
    this.scene.add(this.keyLight);
    this.scene.add(this.fillLight);
    this.scene.add(this.rimLight);
  }

  public setLightingEnabled(
    enabled: boolean
  ): void {
    const lights = [
      this.ambientLight,
      this.keyLight,
      this.fillLight,
      this.rimLight,
    ];

    for (const light of lights) {
      if (light) {
        light.visible = enabled;
      }
    }
  }

  // ============================================================
  // MODEL CENTERING
  // ============================================================

  public centerObject(
    object: THREE.Object3D
  ): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(object);

    if (box.isEmpty()) {
      return new THREE.Vector3();
    }

    const center = new THREE.Vector3();

    box.getCenter(center);

    object.position.sub(center);

    return center;
  }

  // ============================================================
  // MODEL NORMALIZATION
  // ============================================================

  public normalizeObject(
    object: THREE.Object3D,
    targetSize = 2
  ): number {
    const box = new THREE.Box3().setFromObject(object);

    if (box.isEmpty()) {
      return 1;
    }

    const size = new THREE.Vector3();

    box.getSize(size);

    const maxDimension = Math.max(
      size.x,
      size.y,
      size.z
    );

    if (maxDimension <= 0) {
      return 1;
    }

    const scale =
      targetSize / maxDimension;

    object.scale.multiplyScalar(scale);

    return scale;
  }

  public frameObject(
    object: THREE.Object3D
  ): THREE.Box3 {
    return new THREE.Box3().setFromObject(object);
  }

  // ============================================================
  // OBJECT SEARCH
  // ============================================================

  public findObjectByName(
    name: string
  ): THREE.Object3D | null {
    return this.scene.getObjectByName(name) ?? null;
  }

  public findMeshByName(
    name: string
  ): THREE.Mesh | null {
    const object = this.scene.getObjectByName(name);

    if (!object) {
      return null;
    }

    if ((object as THREE.Mesh).isMesh) {
      return object as THREE.Mesh;
    }

    return null;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  public getStatistics(): {
    objectCount: number;
    meshCount: number;
    triangleCount: number;
    vertexCount: number;
  } {
    let objectCount = 0;
    let meshCount = 0;
    let triangleCount = 0;
    let vertexCount = 0;

    this.modelRoot.traverse((object) => {
      objectCount++;

      const mesh = object as THREE.Mesh;

      if (!mesh.isMesh || !mesh.geometry) {
        return;
      }

      meshCount++;

      const geometry = mesh.geometry;

      const position =
        geometry.getAttribute('position');

      if (position) {
        vertexCount += position.count;
      }

      if (geometry.index) {
        triangleCount +=
          geometry.index.count / 3;
      } else if (position) {
        triangleCount +=
          position.count / 3;
      }
    });

    return {
      objectCount,
      meshCount,
      triangleCount,
      vertexCount,
    };
  }

  public getSnapshot(): SceneSnapshot {
    const stats = this.getStatistics();

    return {
      objectCount: stats.objectCount,
      meshCount: stats.meshCount,
      triangleCount: stats.triangleCount,
      selectedObjectId:
        this.selectedObject?.uuid ?? null,
      sceneReady: this.initialized,
    };
  }

  // ============================================================
  // UPDATE
  // ============================================================

  public update(
    deltaTime: number
  ): void {
    if (!this.initialized) {
      return;
    }

    if (
      !Number.isFinite(deltaTime) ||
      deltaTime <= 0
    ) {
      return;
    }

    // Reserved for future:
    // - model animations
    // - environment animation
    // - studio effects
    // - procedural materials
  }

  // ============================================================
  // RESET
  // ============================================================

  public reset(): void {
    this.clearModels();

    this.clearSelection();

    if (this.gridHelper) {
      this.gridHelper.visible =
        this.options.enableGrid;
    }

    if (this.axesHelper) {
      this.axesHelper.visible =
        this.options.enableAxes;
    }

    this.setLightingEnabled(
      this.options.enableDefaultLighting
    );

    this.scene.background =
      new THREE.Color(
        this.options.backgroundColor
      );
  }

  // ============================================================
  // DISPOSAL
  // ============================================================

  private disposeObject(
    object: THREE.Object3D
  ): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) {
        return;
      }

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      this.disposeMaterial(
        mesh.material
      );
    });
  }

  private disposeMaterial(
    material:
      | THREE.Material
      | THREE.Material[]
  ): void {
    if (Array.isArray(material)) {
      material.forEach((mat) => {
        this.disposeMaterial(mat);
      });

      return;
    }

    const textureProperties = [
      'map',
      'normalMap',
      'roughnessMap',
      'metalnessMap',
      'aoMap',
      'emissiveMap',
      'alphaMap',
      'displacementMap',
      'bumpMap',
      'clearcoatMap',
      'clearcoatNormalMap',
      'clearcoatRoughnessMap',
      'sheenColorMap',
      'sheenRoughnessMap',
      'transmissionMap',
      'thicknessMap',
    ] as const;

    for (const property of textureProperties) {
      const texture = (
        material as unknown as Record<
          string,
          THREE.Texture | undefined
        >
      )[property];

      if (texture?.isTexture) {
        texture.dispose();
      }
    }

    material.dispose();
  }

  // ============================================================
  // FULL DISPOSAL
  // ============================================================

  public dispose(): void {
    this.clearModels();

    if (this.gridHelper) {
      this.gridHelper.geometry.dispose();

      const material =
        this.gridHelper.material;

      if (Array.isArray(material)) {
        material.forEach((mat) =>
          mat.dispose()
        );
      } else {
        material.dispose();
      }

      this.gridHelper = null;
    }

    if (this.axesHelper) {
      this.axesHelper.dispose();
      this.axesHelper = null;
    }

    this.disposeLight(
      this.ambientLight
    );

    this.disposeLight(
      this.keyLight
    );

    this.disposeLight(
      this.fillLight
    );

    this.disposeLight(
      this.rimLight
    );

    this.ambientLight = null;
    this.keyLight = null;
    this.fillLight = null;
    this.rimLight = null;

    this.selectedObject = null;

    this.initialized = false;
    this.renderer = null;
    this.camera = null;
  }

  private disposeLight(
    light: THREE.Light | null
  ): void {
    if (!light) {
      return;
    }

    this.scene.remove(light);
  }

  // ============================================================
  // STATE
  // ============================================================

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
}

export default SceneManager;