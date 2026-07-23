import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'
import { loadFBX } from '../utils'
import { SurroundLine } from './surroundLine'
import { Background } from './background'
import { Radar } from './radar'
import { Wall } from './wall'
import { Circle } from './circle'
import { Ball } from './ball'
import { Cone } from './cone'
import { Fly } from './fly'
import { Road } from './road'
import { Font } from './font'
import { Snow } from './snow'
import { Rain } from './rain'
import { Smoke } from './smoke'

const MODEL_URL = '/three-project/city-realtime/model/beijing.fbx'

export class City {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private tweenPosition: TWEEN.Tween<THREE.Vector3> | null = null
  private tweenRotation: TWEEN.Tween<THREE.Euler> | null = null
  private height = { value: 5 }
  private top = { value: 0 }
  private flag = false
  private time = { value: 0 }
  private effect: Record<string, { animation: () => void; dispose?: () => void } | null> = {}
  private wheelHandler: ((event: WheelEvent) => void) | null = null
  private mouseDownHandler: ((event: MouseEvent) => void) | null = null
  private mouseMoveHandler: ((event: MouseEvent) => void) | null = null
  private mouseUpHandler: ((event: MouseEvent) => void) | null = null

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.scene = scene
    this.camera = camera
    this.controls = controls

    this.loadCity()
    this.addWheel()
    this.addClick()
  }

  private async loadCity() {
    try {
      const object = await loadFBX(MODEL_URL)
      object.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          new SurroundLine(this.scene, child as THREE.Mesh, this.height, this.time)
        }
      })
      this.initEffect()
    } catch (error) {
      console.error('城市模型加载失败:', error)
    }
  }

  private initEffect() {
    new Background(this.scene)
    new Radar(this.scene, this.time)
    new Wall(this.scene, this.time)
    new Circle(this.scene, this.time)
    new Ball(this.scene, this.time)
    new Cone(this.scene, this.top, this.height)
    new Fly(this.scene, this.time)
    new Road(this.scene, this.time)
    const font = new Font(this.scene)

    this.effect.snow = new Snow(this.scene)
    this.effect.rain = new Rain(this.scene)
    this.effect.smoke = new Smoke(this.scene)

    // 保留字体引用以便卸载时释放
    this.effect.font = { animation: () => {}, dispose: () => font.dispose() }
  }

  private addWheel() {
    this.wheelHandler = (event: WheelEvent) => {
      const value = 30
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1

      const vector = new THREE.Vector3(x, y, 0.5)
      vector.unproject(this.camera)
      vector.sub(this.camera.position).normalize()

      const delta = event.deltaY < 0 ? value : -value
      this.camera.position.x += vector.x * delta
      this.camera.position.y += vector.y * delta
      this.camera.position.z += vector.z * delta

      this.controls.target.x += vector.x * delta
      this.controls.target.y += vector.y * delta
      this.controls.target.z += vector.z * delta
    }

    window.addEventListener('wheel', this.wheelHandler)
  }

  private addClick() {
    let flag = true

    this.mouseDownHandler = () => {
      flag = true
    }

    this.mouseMoveHandler = () => {
      flag = false
    }

    this.mouseUpHandler = (event: MouseEvent) => {
      if (flag) {
        this.clickEvent(event)
      }
    }

    document.addEventListener('mousedown', this.mouseDownHandler)
    document.addEventListener('mousemove', this.mouseMoveHandler)
    document.addEventListener('mouseup', this.mouseUpHandler)
  }

  private clickEvent(event: MouseEvent) {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -(event.clientY / window.innerHeight) * 2 + 1

    const standardVector = new THREE.Vector3(x, y, 0.5)
    const worldVector = standardVector.unproject(this.camera)
    const ray = worldVector.sub(this.camera.position).normalize()
    const raycaster = new THREE.Raycaster(this.camera.position, ray)
    const intersects = raycaster.intersectObjects(this.scene.children, true)

    const point3d = intersects.length ? intersects[0] : null
    if (!point3d) return

    const proportion = 3
    const time = 1000

    this.tweenPosition = new TWEEN.Tween(this.camera.position)
      .to(
        {
          x: point3d.point.x * proportion,
          y: point3d.point.y * proportion,
          z: point3d.point.z * proportion
        },
        time
      )
      .start()

    this.tweenRotation = new TWEEN.Tween(this.camera.rotation)
      .to(
        {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
          z: this.camera.rotation.z
        },
        time
      )
      .start()
  }

  start(delta: number) {
    Object.values(this.effect).forEach((item) => {
      item?.animation()
    })

    if (this.tweenPosition && this.tweenRotation) {
      this.tweenPosition.update()
      this.tweenRotation.update()
    }

    this.time.value += delta

    this.height.value += 0.4
    if (this.height.value > 160) {
      this.height.value = 5
    }

    if (this.top.value > 15 || this.top.value < 0) {
      this.flag = !this.flag
    }
    this.top.value += this.flag ? -0.8 : 0.8
  }

  dispose() {
    if (this.wheelHandler) {
      window.removeEventListener('wheel', this.wheelHandler)
      this.wheelHandler = null
    }
    if (this.mouseDownHandler) {
      document.removeEventListener('mousedown', this.mouseDownHandler)
      this.mouseDownHandler = null
    }
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler)
      this.mouseMoveHandler = null
    }
    if (this.mouseUpHandler) {
      document.removeEventListener('mouseup', this.mouseUpHandler)
      this.mouseUpHandler = null
    }

    this.tweenPosition?.stop()
    this.tweenRotation?.stop()

    Object.values(this.effect).forEach((item) => {
      item?.dispose?.()
    })
  }
}
