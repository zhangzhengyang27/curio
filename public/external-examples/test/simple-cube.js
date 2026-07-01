import * as THREE from 'three'

const box = window.box
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, box.clientWidth / box.clientHeight, 0.1, 1000)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(box.clientWidth, box.clientHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
box.appendChild(renderer.domElement)

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshNormalMaterial()
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  renderer.setSize(box.clientWidth, box.clientHeight)
  camera.aspect = box.clientWidth / box.clientHeight
  camera.updateProjectionMatrix()
})
