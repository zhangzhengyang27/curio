import {
	BoxGeometry,
	Mesh,
	MeshNormalMaterial,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from 'three'

const scene = new Scene()
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

const canvas = document.getElementById('canvas')
const renderer = new WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)

const geometry = new BoxGeometry()
const material = new MeshNormalMaterial()
const cube = new Mesh(geometry, material)
scene.add(cube)

function animate() {
	requestAnimationFrame(animate)
	cube.rotation.x += 0.01
	cube.rotation.y += 0.01
	renderer.render(scene, camera)
}

animate()

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})

console.log('Hello World')
