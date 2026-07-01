import {
	PointLight,
	BoxGeometry,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage(0, 25, 0)
const { scene, camera, renderer } = stage
renderer.shadowMap.enabled = true

{
	const light = new PointLight()
	light.position.set(0, 6, 0)
	light.castShadow = true
	const {
		shadow,
		shadow: { mapSize, camera },
	} = light
	mapSize.width = 512
	mapSize.height = 512
	camera.near = 0.5
	camera.far = 50

	scene.add(light)
}

for (let z = 0; z < 2; z++) {
	for (let x = 0; x < 2; x++) {
		const mat = new MeshStandardMaterial({
			color: 0xeeeeee,
		})
		const geo = new BoxGeometry(1, 4, 1)
		const mesh = new Mesh(geo, mat)
		mesh.position.y = 2
		mesh.position.x = x * 4 - 2
		mesh.position.z = z * 4 - 2
		mesh.castShadow = true
		scene.add(mesh)
	}
}

{
	const geometry = new PlaneGeometry(2000, 2000)
	geometry.rotateX(-Math.PI / 2)
	const material = new MeshStandardMaterial()
	const plane = new Mesh(geometry, material)
	plane.receiveShadow = true
	scene.add(plane)
}

stage.animate()
