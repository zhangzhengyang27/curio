import {
	SpotLight,
	BoxGeometry,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage(6, 6, 3)
const { scene, camera, renderer } = stage
renderer.shadowMap.enabled = true

{
	const light = new SpotLight(0x00acec)
	light.position.set(2, 5, 3)
	light.castShadow = true
	light.angle = 0.3
	light.penumbra = 0.5

	light.decay = 2
	light.distance = 50
	const {
		shadow: { mapSize, camera },
	} = light
	mapSize.width = 512
	mapSize.height = 512
	camera.near = 1
	camera.far = 10

	scene.add(light)
}

const mat = new MeshStandardMaterial({
	color: 0xeeeeee,
})
const geo = new BoxGeometry(1, 0.5, 1)
const mesh = new Mesh(geo, mat)
mesh.position.set(0, 1, 0)
mesh.castShadow = true
scene.add(mesh)

{
	const geometry = new PlaneGeometry(2000, 2000)
	geometry.rotateX(-Math.PI / 2)
	const material = new MeshStandardMaterial()
	const plane = new Mesh(geometry, material)
	plane.receiveShadow = true
	scene.add(plane)
}

stage.animate()
