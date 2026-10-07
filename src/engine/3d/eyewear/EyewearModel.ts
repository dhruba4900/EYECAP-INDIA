import * as THREE from 'three';

export class EyewearModel {
  public group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Eyewear_Root';
    this.buildBaseEyewear();
  }

  private buildBaseEyewear(): void {
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.2,
      metalness: 0.8,
    });

    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    const ringGeo = new THREE.TorusGeometry(12, 1, 16, 100);
    const leftRing = new THREE.Mesh(ringGeo, frameMaterial);
    leftRing.position.x = -15;
    leftRing.name = 'Frame_Left';

    const rightRing = new THREE.Mesh(ringGeo, frameMaterial);
    rightRing.position.x = 15;
    rightRing.name = 'Frame_Right';

    const bridgeGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 16);
    const bridge = new THREE.Mesh(bridgeGeo, frameMaterial);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.x = 0;
    bridge.name = 'Frame_Bridge';

    const lensGeo = new THREE.CylinderGeometry(11.8, 11.8, 0.5, 32);
    const leftLens = new THREE.Mesh(lensGeo, lensMaterial);
    leftLens.rotation.x = Math.PI / 2;
    leftLens.position.x = -15;
    leftLens.name = 'Lens_Left';

    const rightLens = new THREE.Mesh(lensGeo, lensMaterial);
    rightLens.rotation.x = Math.PI / 2;
    rightLens.position.x = 15;
    rightLens.name = 'Lens_Right';

    const templeGeo = new THREE.BoxGeometry(1, 1, 40);
    const leftTemple = new THREE.Mesh(templeGeo, frameMaterial);
    leftTemple.position.set(-27, 0, -20);
    leftTemple.name = 'Temple_Left';

    const rightTemple = new THREE.Mesh(templeGeo, frameMaterial);
    rightTemple.position.set(27, 0, -20);
    rightTemple.name = 'Temple_Right';

    this.group.add(leftRing, rightRing, bridge, leftLens, rightLens, leftTemple, rightTemple);
  }
}
