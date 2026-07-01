import { BoxGeometry, Color, EquirectangularReflectionMapping, EventDispatcher, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, SRGBColorSpace, TextureLoader, WebGLRenderer } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ResourceTracker } from './ResourceTracker.js'

class Box extends EventDispatcher {
  robotType
  renderer = new WebGLRenderer({ antialias: true })
  scene = new Scene()
  camera = new PerspectiveCamera(45, 1, 0.01, 200)
  controls = new OrbitControls(this.camera, this.renderer.domElement)
  box = new Mesh()
  resourceTracker = new ResourceTracker()
  frame = 0
  constructor(type) {
    super()
    this.robotType = type
  }
  init() {
    const { resourceTracker } = this
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.scene.background = new Color(0xf6f6f8)
    this.camera.position.set(0, 1.2, 3.6)
    this.camera.lookAt(0, 0, 0)
    new RGBELoader().loadAsync(
      '/external-examples/threejs-lesson/09-cleanup/public/textures/venice_sunset_1k.hdr',
    ).then((texture) => {
      texture.mapping = EquirectangularReflectionMapping
      this.scene.environment = texture
      resourceTracker.track(texture)
    })

    const boxGeometry = new BoxGeometry(1, 1, 1)
    const boxMaterial = new MeshStandardMaterial({
      metalness: 1,
      roughness: 0.3,
    })
    this.box = new Mesh(boxGeometry, boxMaterial)
    this.scene.add(this.box)
    resourceTracker.track(this.box)
    new TextureLoader().loadAsync(
      '/external-examples/threejs-lesson/09-cleanup/public/textures/wall.jpg',
    ).then((map) => {
      map.colorSpace = SRGBColorSpace
      boxMaterial.map = map
      boxMaterial.needsUpdate = true
      resourceTracker.track(map)
    })
  }

  rotate(angle) {
    this.box.rotation.y = angle
  }

  resize(width, height) {
    const { renderer, camera } = this
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, true)
  }

  render(time = 0) {
    const { renderer, scene, camera } = this
    this.dispatchEvent({ type: 'beforerender', time })
    renderer.render(scene, camera)
    this.dispatchEvent({ type: 'affterrender', time })
  }

  animate(time = 0) {
    this.render(time)
    this.frame = requestAnimationFrame(this.animate.bind(this))
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.resourceTracker.dispose()
    this.renderer?.dispose()
    this.controls?.dispose()
  }
}

export default Box
