import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Stage {
  constructor(x = 2, y = 3, z = 4) {
    this.scene = new Scene()
    this.renderer = new WebGLRenderer({ antialias: true, canvas: document.getElementById('canvas') })
    const { clientWidth, clientHeight } = this.renderer.domElement
    this.renderer.setSize(clientWidth * window.devicePixelRatio, clientHeight * window.devicePixelRatio, false)
    this.camera = new PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.beforeRender = () => {}
  }

  responsive() {
    const { renderer, camera } = this
    if (this.resizeRendererToDisplaySize()) {
      const { clientWidth, clientHeight } = renderer.domElement
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
  }

  resizeRendererToDisplaySize() {
    const { renderer } = this
    const { width, height, clientWidth, clientHeight } = renderer.domElement
    const [w, h] = [clientWidth * window.devicePixelRatio, clientHeight * window.devicePixelRatio]
    const needResize = width !== w || height !== h
    if (needResize) {
      renderer.setSize(w, h, false)
    }
    return needResize
  }

  animate(time = 0) {
    this.responsive()
    this.beforeRender(time)
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame((time) => {
      this.animate(time)
    })
  }
}
