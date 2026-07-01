import {
	AmbientLight,
	BoxGeometry,
	DirectionalLight,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage(4, 4, 4)
const { scene } = stage

const ambientLight = new AmbientLight(0xffffff, 0.3)
scene.add(ambientLight)

const dirLight = new DirectionalLight(0xffffff, 1)
dirLight.position.set(3, 5, 2)
scene.add(dirLight)

const box = new Mesh(
	new BoxGeometry(1, 1, 1),
	new MeshStandardMaterial({ color: 0x00acec })
)
box.position.y = 0.5
scene.add(box)

const plane = new Mesh(
	new PlaneGeometry(10, 10),
	new MeshStandardMaterial({ color: 0xeeeeee })
)
plane.rotation.x = -Math.PI / 2
plane.receiveShadow = true
scene.add(plane)

stage.animate()
