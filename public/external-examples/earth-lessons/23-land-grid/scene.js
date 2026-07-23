import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createEarth } from './earth.js'

const scene = new THREE.Scene()

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.position.set(400, 200, 300)
scene.add(directionalLight)

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight2.position.set(-400, -200, -300)
scene.add(directionalLight2)

const ambient = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambient)

const canvas = document.getElementById('canvas')
const width = canvas.clientWidth
const height = canvas.clientHeight
const k = width / height
const s = 120
const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000)
camera.position.set(-102, 205, -342)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(width, height, false)
renderer.setClearColor(0xb9d3ff, 1)

const controls = new OrbitControls(camera, renderer.domElement)

const earth = createEarth(110)
scene.add(earth)

function render() {
  earth.rotateY(0.004)
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}
render()

window.addEventListener('resize', () => {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const k = w / h
  camera.left = -s * k
  camera.right = s * k
  camera.top = s
  camera.bottom = -s
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
})

export { scene, renderer, camera }
