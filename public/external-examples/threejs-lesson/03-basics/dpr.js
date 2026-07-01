import {
  BoxGeometry,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

const scene = new Scene()
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

const canvas = document.getElementById('canvas')
const renderer = new WebGLRenderer({ canvas, antialias: true })

const geometry = new BoxGeometry()
const material = new MeshPhongMaterial({ color: 0x44aa88 })
const cubes = [-2, 0, 2].map((x) => makeInstance(x))
scene.add(...cubes)

function makeInstance(x) {
  const cube = new Mesh(geometry, material)
  cube.position.x = x
  return cube
}

const light = new DirectionalLight(0xffffff, 1)
light.position.set(-1, 2, 4)
scene.add(light)

function resizeRendererToDisplaySize(renderer) {
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const dpr = window.devicePixelRatio
  const [w, h] = [clientWidth * dpr, clientHeight * dpr]
  const needResize = width !== w || height !== h
  if (needResize) {
    renderer.setSize(w, h, false)
  }
  return needResize
}

function animate() {
  requestAnimationFrame(animate)
  if (resizeRendererToDisplaySize(renderer)) {
    const { clientWidth, clientHeight } = renderer.domElement
    camera.aspect = clientWidth / clientHeight
    camera.updateProjectionMatrix()
  }
  cubes.forEach((cube) => {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  })

  renderer.render(scene, camera)
}

animate()
