import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import { ResourceTracker } from '../component/ResourceTracker.js'

const renderer = new WebGLRenderer({ antialias: true })
renderer.setPixelRatio(devicePixelRatio)
const camera = new PerspectiveCamera(60, 2, 0.1, 5)
camera.position.set(2, 2, 2)
camera.lookAt(0, 0, 0)
const scene = new Scene()
const resTracker = new ResourceTracker()
const geometry = new BoxGeometry(1, 1, 1)
const loader = new TextureLoader()
const texture = loader.load('https://threejs.org/manual/examples/resources/images/wall.jpg')
texture.colorSpace = SRGBColorSpace
const material = new MeshBasicMaterial({
  map: texture,
})
const cube = new Mesh(geometry, material)
scene.add(cube)

resTracker.track(scene)

function resize() {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

document.body.appendChild(renderer.domElement)
resize()
renderer.render(scene, camera)
