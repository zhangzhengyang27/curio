import * as THREE from 'three'

const ASSET_BASE = '/three-project/city-realtime/assets'

interface PointsOptions {
  size: number
  opacity: number
  range: number
  count: number
  setAnimation: (position: THREE.Vector3 & { speedX?: number; speedY?: number; speedZ?: number }) => void
  setPosition: (position: THREE.Vector3 & { speedX?: number; speedY?: number; speedZ?: number }) => void
  url: string
}

export class Points {
  private scene: THREE.Scene
  private range: number
  private count: number
  private size: number
  private opacity: number
  private setAnimation: PointsOptions['setAnimation']
  private setPosition: PointsOptions['setPosition']
  private url: string
  private pointList: Array<THREE.Vector3 & { speedX?: number; speedY?: number; speedZ?: number }> = []
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private point: THREE.Points

  constructor(scene: THREE.Scene, options: PointsOptions) {
    this.scene = scene
    this.range = options.range
    this.count = options.count
    this.size = options.size
    this.opacity = options.opacity
    this.setAnimation = options.setAnimation
    this.setPosition = options.setPosition
    this.url = options.url

    this.geometry = new THREE.BufferGeometry()
    this.material = new THREE.PointsMaterial({
      size: this.size,
      map: new THREE.TextureLoader().load(this.url.startsWith('http') ? this.url : `${ASSET_BASE}/${this.url}`),
      transparent: true,
      opacity: this.opacity,
      depthTest: false
    })
    this.point = new THREE.Points(this.geometry, this.material)

    this.init()
  }

  private init() {
    for (let i = 0; i < this.count; i++) {
      const position = new THREE.Vector3(
        Math.random() * this.range - this.range / 2,
        Math.random() * this.range,
        Math.random() * this.range - this.range / 2
      ) as THREE.Vector3 & { speedX?: number; speedY?: number; speedZ?: number }

      this.setPosition(position)
      this.pointList.push(position)
    }
    this.geometry.setFromPoints(this.pointList)
    this.scene.add(this.point)
  }

  animation() {
    this.pointList.forEach((position) => {
      this.setAnimation(position)
    })
    this.geometry.setFromPoints(this.pointList)
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.material.map?.dispose()
  }
}
