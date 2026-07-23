import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const FONT_URL = '/three-project/city-realtime/font/font.json'

interface TextItem {
  text: string
  size: number
  position: { x: number; y: number; z: number }
  rotate: number
  color: string
}

export class Font {
  private scene: THREE.Scene
  private font: ReturnType<FontLoader['parse']> | null = null
  private meshes: THREE.Mesh[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.init()
  }

  private init() {
    const loader = new FontLoader()
    loader.load(FONT_URL, (font) => {
      this.font = font
      this.createTextQueue()
    })
  }

  private createTextQueue() {
    if (!this.font) return

    const queue: TextItem[] = [
      { text: '最高的楼', size: 20, position: { x: -10, y: 130, z: 410 }, rotate: Math.PI / 1.3, color: '#ffffff' },
      { text: '第二高', size: 20, position: { x: 180, y: 110, z: -70 }, rotate: Math.PI / 2, color: '#ffffff' }
    ]

    queue.forEach((item) => this.createText(item))
  }

  private createText(data: TextItem) {
    if (!this.font) return

    const geometry = new TextGeometry(data.text, {
      font: this.font,
      size: data.size,
      depth: 2
    })

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      `
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(data.position.x, data.position.y, data.position.z)
    mesh.rotateY(data.rotate)
    this.scene.add(mesh)
    this.meshes.push(mesh)
  }

  dispose() {
    this.meshes.forEach((mesh) => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.meshes = []
  }
}
