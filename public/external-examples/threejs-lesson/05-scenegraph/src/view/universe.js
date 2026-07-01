import {
	DirectionalLight,
	Group,
	Mesh,
	MeshPhongMaterial,
	PointLight,
	SphereGeometry,
} from 'three'
import Stage from '../component/Stage.js'
import AxesGridHelper from '../component/AxesGridHelper.js'
import { GUI } from 'dat.gui'

const stage = new Stage()
const { scene, camera } = stage

camera.position.set(0, 20, 0)
camera.up.set(0, 0, -1)
camera.lookAt(0, 0, 0)

const light = new PointLight(0xffffff, 3)
scene.add(light)

const radius = 1
const widthSegments = 16
const heightSegments = 16
const sphereGeometry = new SphereGeometry(radius, widthSegments, heightSegments)

const objects = []

const solarSystem = new Group()
scene.add(solarSystem)
objects.push(solarSystem)

const earthSystem = new Group()
earthSystem.position.x = 5
solarSystem.add(earthSystem)
objects.push(earthSystem)

const moonSystem = new Group()
moonSystem.position.x = 2
earthSystem.add(moonSystem)
objects.push(moonSystem)

const sunMaterial = new MeshPhongMaterial({ emissive: 0xffff00 })
const sunMesh = new Mesh(sphereGeometry, sunMaterial)
solarSystem.add(sunMesh)

const earthMaterial = new MeshPhongMaterial({
	color: 0x2233ff,
	emissive: 0x112244,
})
const earthMesh = new Mesh(sphereGeometry, earthMaterial)
earthMesh.scale.set(0.5, 0.5, 0.5)
earthSystem.add(earthMesh)

const moonMaterial = new MeshPhongMaterial({
	color: 0x999999,
	emissive: 0x999999,
})
const moonMesh = new Mesh(sphereGeometry, moonMaterial)
moonMesh.scale.set(0.2, 0.2, 0.2)
moonSystem.add(moonMesh)

stage.beforeRender = (time = 0) => {
	time *= 0.001
	objects.forEach((obj) => {
		obj.rotation.y = time
	})
}

const gui = new GUI({ autoPlace: false })
makeAxesGrid(solarSystem, 'solarSystem')
makeAxesGrid(earthSystem, 'earthSystem')
makeAxesGrid(moonSystem, 'moonSystem')
function makeAxesGrid(obj, label) {
	const helper = new AxesGridHelper(obj)
	gui.add(helper, 'visible').name(label)
}

document.getElementById('box').appendChild(gui.domElement)

stage.animate()
