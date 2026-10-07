import * as THREE from 'three';

export interface ModelTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface ModelBounds {
  box: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
}

export interface ModelControllerOptions {
  minScale?: number;
  maxScale?: number;
  defaultScale?: THREE.Vector3;
  preserveWorldTransform?: boolean;
}

export interface TransformSnapshot {
  position: [number, number, number];
  rotation: [number, number, number];
  quaternion: [number, number, number, number];
  scale: [number, number, number];
}

/**
 * EYECAP 3D Studio
 *
 * Controls transformation and state of a loaded 3D model.
 *
 * Responsibilities:
 * - Position
 * - Rotation
 * - Scale
 * - Reset transform
 * - Bounds calculation
 * - Visibility
 * - Pivot/origin handling
 * - Transform snapshots
 * - Basic undo/redo history
 *
 * This class does not own the Three.js Scene.
 */
export class ModelController {
  private model: THREE.Object3D | null = null;

  private initialTransform:
    | TransformSnapshot
    | null = null;

  private options: Required<
    Pick<
      ModelControllerOptions,
      | 'minScale'
      | 'maxScale'
      | 'preserveWorldTransform'
    >
  > & {
    defaultScale: THREE.Vector3;
  };

  private undoStack: TransformSnapshot[] = [];
  private redoStack: TransformSnapshot[] = [];

  private historyLimit = 100;

  constructor(
    options: ModelControllerOptions = {}
  ) {
    this.options = {
      minScale: options.minScale ?? 0.001,
      maxScale: options.maxScale ?? 1000,
      defaultScale:
        options.defaultScale?.clone() ??
        new THREE.Vector3(1, 1, 1),
      preserveWorldTransform:
        options.preserveWorldTransform ?? true,
    };
  }

  // ============================================================
  // MODEL
  // ============================================================

  public setModel(
    model: THREE.Object3D | null
  ): void {
    this.clearHistory();

    this.model = model;

    if (!model) {
      this.initialTransform = null;
      return;
    }

    model.updateMatrixWorld(true);

    this.initialTransform =
      this.createSnapshot();

    this.clearHistory();
  }

  public getModel(): THREE.Object3D | null {
    return this.model;
  }

  public hasModel(): boolean {
    return this.model !== null;
  }

  // ============================================================
  // POSITION
  // ============================================================

  public setPosition(
    x: number,
    y: number,
    z: number
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.model.position.set(
      x,
      y,
      z
    );

    this.updateMatrix();
  }

  public setPositionVector(
    position: THREE.Vector3
  ): void {
    if (!this.model) {
      return;
    }

    this.setPosition(
      position.x,
      position.y,
      position.z
    );
  }

  public move(
    x: number,
    y: number,
    z: number
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.model.position.x += x;
    this.model.position.y += y;
    this.model.position.z += z;

    this.updateMatrix();
  }

  public moveX(
    amount: number
  ): void {
    this.move(amount, 0, 0);
  }

  public moveY(
    amount: number
  ): void {
    this.move(0, amount, 0);
  }

  public moveZ(
    amount: number
  ): void {
    this.move(0, 0, amount);
  }

  public getPosition(): THREE.Vector3 {
    return (
      this.model?.position.clone() ??
      new THREE.Vector3()
    );
  }

  // ============================================================
  // ROTATION
  // ============================================================

  public setRotation(
    x: number,
    y: number,
    z: number,
    order: THREE.EulerOrder = 'XYZ'
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.model.rotation.set(
      x,
      y,
      z,
      order
    );

    this.updateMatrix();
  }

  public setRotationDegrees(
    x: number,
    y: number,
    z: number
  ): void {
    this.setRotation(
      THREE.MathUtils.degToRad(x),
      THREE.MathUtils.degToRad(y),
      THREE.MathUtils.degToRad(z)
    );
  }

  public rotate(
    x: number,
    y: number,
    z: number
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.model.rotateX(x);
    this.model.rotateY(y);
    this.model.rotateZ(z);

    this.updateMatrix();
  }

  public rotateX(
    radians: number
  ): void {
    this.rotate(
      radians,
      0,
      0
    );
  }

  public rotateY(
    radians: number
  ): void {
    this.rotate(
      0,
      radians,
      0
    );
  }

  public rotateZ(
    radians: number
  ): void {
    this.rotate(
      0,
      0,
      radians
    );
  }

  public getRotation(): THREE.Euler {
    return (
      this.model?.rotation.clone() ??
      new THREE.Euler()
    );
  }

  public getRotationDegrees(): THREE.Vector3 {
    if (!this.model) {
      return new THREE.Vector3();
    }

    return new THREE.Vector3(
      THREE.MathUtils.radToDeg(
        this.model.rotation.x
      ),
      THREE.MathUtils.radToDeg(
        this.model.rotation.y
      ),
      THREE.MathUtils.radToDeg(
        this.model.rotation.z
      )
    );
  }

  // ============================================================
  // SCALE
  // ============================================================

  public setScale(
    x: number,
    y?: number,
    z?: number
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    const scaleY =
      y ?? x;

    const scaleZ =
      z ?? x;

    this.model.scale.set(
      this.clampScale(x),
      this.clampScale(scaleY),
      this.clampScale(scaleZ)
    );

    this.updateMatrix();
  }

  public setUniformScale(
    scale: number
  ): void {
    this.setScale(scale);
  }

  public scaleBy(
    factor: number
  ): void {
    if (!this.model) {
      return;
    }

    if (
      !Number.isFinite(factor) ||
      factor <= 0
    ) {
      return;
    }

    this.saveHistory();

    this.model.scale.x =
      this.clampScale(
        this.model.scale.x * factor
      );

    this.model.scale.y =
      this.clampScale(
        this.model.scale.y * factor
      );

    this.model.scale.z =
      this.clampScale(
        this.model.scale.z * factor
      );

    this.updateMatrix();
  }

  public getScale(): THREE.Vector3 {
    return (
      this.model?.scale.clone() ??
      new THREE.Vector3(1, 1, 1)
    );
  }

  private clampScale(
    value: number
  ): number {
    if (!Number.isFinite(value)) {
      return 1;
    }

    return THREE.MathUtils.clamp(
      Math.abs(value),
      this.options.minScale,
      this.options.maxScale
    );
  }

  // ============================================================
  // RESET
  // ============================================================

  public resetTransform(): void {
    if (
      !this.model ||
      !this.initialTransform
    ) {
      return;
    }

    this.saveHistory();

    this.restoreSnapshot(
      this.initialTransform
    );
  }

  public resetPosition(): void {
    if (
      !this.model ||
      !this.initialTransform
    ) {
      return;
    }

    this.saveHistory();

    const p =
      this.initialTransform.position;

    this.model.position.set(
      p[0],
      p[1],
      p[2]
    );

    this.updateMatrix();
  }

  public resetRotation(): void {
    if (
      !this.model ||
      !this.initialTransform
    ) {
      return;
    }

    this.saveHistory();

    const q =
      this.initialTransform.quaternion;

    this.model.quaternion.set(
      q[0],
      q[1],
      q[2],
      q[3]
    );

    this.updateMatrix();
  }

  public resetScale(): void {
    if (
      !this.model ||
      !this.initialTransform
    ) {
      return;
    }

    this.saveHistory();

    const s =
      this.initialTransform.scale;

    this.model.scale.set(
      s[0],
      s[1],
      s[2]
    );

    this.updateMatrix();
  }

  // ============================================================
  // DEFAULT TRANSFORM
  // ============================================================

  public applyDefaultScale(): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.model.scale.copy(
      this.options.defaultScale
    );

    this.updateMatrix();
  }

  // ============================================================
  // BOUNDS
  // ============================================================

  public getBounds(): ModelBounds | null {
    if (!this.model) {
      return null;
    }

    this.model.updateMatrixWorld(true);

    const box =
      new THREE.Box3().setFromObject(
        this.model
      );

    if (box.isEmpty()) {
      return null;
    }

    const center =
      new THREE.Vector3();

    const size =
      new THREE.Vector3();

    box.getCenter(center);
    box.getSize(size);

    const radius =
      size.length() * 0.5;

    return {
      box,
      center,
      size,
      radius,
    };
  }

  public getSize(): THREE.Vector3 {
    return (
      this.getBounds()?.size.clone() ??
      new THREE.Vector3()
    );
  }

  public getCenter(): THREE.Vector3 {
    return (
      this.getBounds()?.center.clone() ??
      new THREE.Vector3()
    );
  }

  // ============================================================
  // CENTER MODEL
  // ============================================================

  public centerAtOrigin(): void {
    if (!this.model) {
      return;
    }

    const bounds =
      this.getBounds();

    if (!bounds) {
      return;
    }

    this.saveHistory();

    this.model.position.sub(
      bounds.center
    );

    this.updateMatrix();
  }

  // ============================================================
  // GROUND MODEL
  // ============================================================

  public placeOnGround(
    groundY = 0
  ): void {
    if (!this.model) {
      return;
    }

    const bounds =
      this.getBounds();

    if (!bounds) {
      return;
    }

    this.saveHistory();

    this.model.position.y +=
      groundY -
      bounds.box.min.y;

    this.updateMatrix();
  }

  // ============================================================
  // PIVOT
  // ============================================================

  public movePivotToCenter(): void {
    if (!this.model) {
      return;
    }

    const bounds =
      this.getBounds();

    if (!bounds) {
      return;
    }

    const worldCenter =
      bounds.center.clone();

    const parent =
      this.model.parent;

    if (!parent) {
      return;
    }

    const localCenter =
      parent.worldToLocal(
        worldCenter
      );

    const offset =
      localCenter.clone().sub(
        this.model.position
      );

    this.model.traverse(
      (child) => {
        if (child === this.model) {
          return;
        }

        child.position.sub(
          offset
        );
      }
    );

    this.model.position.copy(
      localCenter
    );

    this.updateMatrix();
  }

  // ============================================================
  // VISIBILITY
  // ============================================================

  public setVisible(
    visible: boolean
  ): void {
    if (!this.model) {
      return;
    }

    this.model.visible =
      visible;
  }

  public toggleVisibility(): boolean {
    if (!this.model) {
      return false;
    }

    this.model.visible =
      !this.model.visible;

    return this.model.visible;
  }

  public isVisible(): boolean {
    return (
      this.model?.visible ??
      false
    );
  }

  // ============================================================
  // MATRIX
  // ============================================================

  private updateMatrix(): void {
    if (!this.model) {
      return;
    }

    this.model.updateMatrix();
    this.model.updateMatrixWorld(
      true
    );
  }

  public updateMatrixWorld(): void {
    this.model?.updateMatrixWorld(
      true
    );
  }

  // ============================================================
  // SNAPSHOT
  // ============================================================

  public createSnapshot(): TransformSnapshot {
    if (!this.model) {
      throw new Error(
        'Cannot create a transform snapshot without a model.'
      );
    }

    return {
      position: [
        this.model.position.x,
        this.model.position.y,
        this.model.position.z,
      ],

      rotation: [
        this.model.rotation.x,
        this.model.rotation.y,
        this.model.rotation.z,
      ],

      quaternion: [
        this.model.quaternion.x,
        this.model.quaternion.y,
        this.model.quaternion.z,
        this.model.quaternion.w,
      ],

      scale: [
        this.model.scale.x,
        this.model.scale.y,
        this.model.scale.z,
      ],
    };
  }

  public restoreSnapshot(
    snapshot: TransformSnapshot
  ): void {
    if (!this.model) {
      return;
    }

    this.model.position.set(
      snapshot.position[0],
      snapshot.position[1],
      snapshot.position[2]
    );

    this.model.quaternion.set(
      snapshot.quaternion[0],
      snapshot.quaternion[1],
      snapshot.quaternion[2],
      snapshot.quaternion[3]
    );

    this.model.scale.set(
      snapshot.scale[0],
      snapshot.scale[1],
      snapshot.scale[2]
    );

    this.updateMatrix();
  }

  // ============================================================
  // UNDO / REDO
  // ============================================================

  private saveHistory(): void {
    if (!this.model) {
      return;
    }

    const snapshot =
      this.createSnapshot();

    this.undoStack.push(
      snapshot
    );

    if (
      this.undoStack.length >
      this.historyLimit
    ) {
      this.undoStack.shift();
    }

    this.redoStack = [];
  }

  public undo(): boolean {
    if (
      !this.model ||
      this.undoStack.length === 0
    ) {
      return false;
    }

    const current =
      this.createSnapshot();

    const previous =
      this.undoStack.pop();

    if (!previous) {
      return false;
    }

    this.redoStack.push(
      current
    );

    this.restoreSnapshot(
      previous
    );

    return true;
  }

  public redo(): boolean {
    if (
      !this.model ||
      this.redoStack.length === 0
    ) {
      return false;
    }

    const current =
      this.createSnapshot();

    const next =
      this.redoStack.pop();

    if (!next) {
      return false;
    }

    this.undoStack.push(
      current
    );

    this.restoreSnapshot(
      next
    );

    return true;
  }

  public canUndo(): boolean {
    return (
      this.undoStack.length > 0
    );
  }

  public canRedo(): boolean {
    return (
      this.redoStack.length > 0
    );
  }

  public clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // ============================================================
  // SERIALIZATION
  // ============================================================

  public serializeTransform(): TransformSnapshot | null {
    if (!this.model) {
      return null;
    }

    return this.createSnapshot();
  }

  public deserializeTransform(
    snapshot: TransformSnapshot
  ): void {
    if (!this.model) {
      return;
    }

    this.saveHistory();

    this.restoreSnapshot(
      snapshot
    );
  }

  // ============================================================
  // DUPLICATE
  // ============================================================

  public cloneModel(): THREE.Object3D | null {
    if (!this.model) {
      return null;
    }

    const clone =
      this.model.clone(true);

    clone.position.copy(
      this.model.position
    );

    clone.quaternion.copy(
      this.model.quaternion
    );

    clone.scale.copy(
      this.model.scale
    );

    clone.updateMatrixWorld(
      true
    );

    return clone;
  }

  // ============================================================
  // MODEL INFO
  // ============================================================

  public getModelName(): string | null {
    return this.model?.name || null;
  }

  public setModelName(
    name: string
  ): void {
    if (!this.model) {
      return;
    }

    this.model.name =
      name.trim() ||
      'EYECAP_MODEL';
  }

  public getUUID(): string | null {
    return this.model?.uuid ?? null;
  }

  // ============================================================
  // DISPOSE
  // ============================================================

  public clearModel(): void {
    this.model = null;
    this.initialTransform = null;

    this.clearHistory();
  }

  public dispose(): void {
    this.clearModel();
  }
}

export default ModelController;