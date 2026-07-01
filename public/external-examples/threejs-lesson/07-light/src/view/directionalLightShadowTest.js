import {
	DirectionalLight,
	BoxGeometry,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
	Vector3,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage(20, 20, 10)
const { scene, camera, renderer } = stage
renderer.shadowMap.enabled = true

{
	const light = new DirectionalLight()
	light.position.set(0, 8, 12)
	light.castShadow = true
	const {
		shadow: { mapSize, camera },
	} = light
	mapSize.width = 5120
	mapSize.height = 5120
	camera.near = 0.5
	camera.far = 50
	camera.left = -100
	camera.right = 100
	camera.top = 100
	camera.bottom = -100

	scene.add(light)
}

{
	const mat = new MeshStandardMaterial({
		color: 0xeeeeee,
	})
	const geo = new BoxGeometry(15, 4, 15)
	const mesh = new Mesh(geo, mat)
	mesh.position.y = 2
	mesh.castShadow = true
	scene.add(mesh)
}

{
	const geometry = new PlaneGeometry(2000, 2000)
	geometry.rotateX(-Math.PI / 2)
	const material = new MeshStandardMaterial()
	const plane = new Mesh(geometry, material)
	plane.receiveShadow = true
	scene.add(plane)
}

const a = new Vector3(2, 0, 0)
const b = new Vector3(0, 1, 0)
const c = a.clone().cross(b)
c.x = a.y * b.z - a.z * b.y
c.y = a.z * b.x - a.x * b.z
c.z = a.x * b.y - a.y * b.x
c.setLength(1)
console.log(c)

stage.animate()
