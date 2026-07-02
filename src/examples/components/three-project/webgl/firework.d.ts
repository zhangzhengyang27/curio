import * as THREE from "three"

export default class Fireworks {
  constructor(color: string, to: { x: number; y: number; z: number }, from?: { x: number; y: number; z: number })
  addScene(scene: THREE.Scene, camera: THREE.Camera): void
  update(): string | undefined
}
