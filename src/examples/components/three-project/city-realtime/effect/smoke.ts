import * as THREE from 'three'

const ASSET_BASE = '/three-project/city-realtime/assets'

interface SmokeParticle {
  size: number
  opacity: number
  x: number
  y: number
  z: number
  speed: { x: number; y: number; z: number }
  scale: number
}

export class Smoke {
  private scene: THREE.Scene
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private points: THREE.Points
  private smokes: SmokeParticle[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.geometry = new THREE.BufferGeometry()
    this.material = new THREE.PointsMaterial({
      size: 50,
      map: new THREE.TextureLoader().load(`${ASSET_BASE}/smoke.png`),
      transparent: true,
      depthWrite: false
    })

    this.material.onBeforeCompile = function (shader) {
      const vertex1 = `
        attribute float a_opacity;
        attribute float a_size;
        attribute float a_scale;
        varying float v_opacity;

        void main() {
          v_opacity = a_opacity;
      `

      const glPosition = `
        gl_PointSize = a_size * a_scale;
      `

      shader.vertexShader = shader.vertexShader.replace('void main() {', vertex1)
      shader.vertexShader = shader.vertexShader.replace('gl_PointSize = size', glPosition)

      const fragment1 = `
        varying float v_opacity;

        void main() {
      `
      const fragment2 = `
        gl_FragColor = vec4(outgoingLight, diffuseColor.a * v_opacity);
      `

      shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragment1)
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4(outgoingLight, diffuseColor.a);',
        fragment2
      )
    }

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  private createParticle() {
    this.smokes.push({
      size: 50,
      opacity: 1,
      x: 0,
      y: 0,
      z: 0,
      speed: {
        x: Math.random(),
        y: Math.random() + 0.3,
        z: Math.random()
      },
      scale: 1
    })
  }

  private setAttribute(
    positionList: number[],
    opacityList: number[],
    sizeList: number[],
    scaleList: number[]
  ) {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionList), 3))
    this.geometry.setAttribute('a_opacity', new THREE.BufferAttribute(new Float32Array(opacityList), 1))
    this.geometry.setAttribute('a_size', new THREE.BufferAttribute(new Float32Array(sizeList), 1))
    this.geometry.setAttribute('a_scale', new THREE.BufferAttribute(new Float32Array(scaleList), 1))
  }

  private update() {
    const positionList: number[] = []
    const sizeList: number[] = []
    const scaleList: number[] = []
    const opacityList: number[] = []

    this.smokes = this.smokes.filter((item) => {
      if (item.opacity < 0) {
        return false
      }
      item.opacity -= 0.01
      item.x += item.speed.x
      item.y += item.speed.y
      item.z += item.speed.z
      item.scale += 0.01

      positionList.push(item.x, item.y, item.z)
      sizeList.push(item.size)
      scaleList.push(item.scale)
      opacityList.push(item.opacity)

      return true
    })

    this.setAttribute(positionList, opacityList, sizeList, scaleList)
  }

  animation() {
    this.createParticle()
    this.update()
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.material.map?.dispose()
  }
}
