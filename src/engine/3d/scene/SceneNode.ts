import * as THREE from 'three';

export class SceneNode {
  public id: string;
  public name: string;
  public object3D: THREE.Object3D;
  public children: SceneNode[] = [];
  public parent: SceneNode | null = null;

  constructor(id: string, name: string, object3D: THREE.Object3D = new THREE.Group()) {
    this.id = id;
    this.name = name;
    this.object3D = object3D;
    this.object3D.userData = { nodeId: id, nodeName: name };
  }

  public addChild(child: SceneNode): void {
    child.parent = this;
    this.children.push(child);
    this.object3D.add(child.object3D);
  }

  public setVisible(visible: boolean): void {
    this.object3D.visible = visible;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.object3D.position.set(x, y, z);
  }
}
