import * as THREE from 'three'

const ASSET_BASE = '/three-project/city-realtime/assets'

export class Background {
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.init()
  }

  /**
   * 创建天空盒
   */
  private init() {
    const loader = new THREE.TextureLoader()
    const geometry = new THREE.SphereGeometry(5000, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: loader.load(`${ASSET_BASE}/black-bg.png`)
    })

    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(0, 0, 0)
    this.scene.add(sphere)
  }
}
