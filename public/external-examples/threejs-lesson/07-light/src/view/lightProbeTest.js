import {
	LightProbe,
	Mesh,
	MeshStandardMaterial,
	SphereGeometry,
	CubeTextureLoader,
	SRGBColorSpace,
} from 'three'
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js'
import Stage from '../component/Stage.js'

const stage = new Stage(0, 0, 6)
const { scene, camera, renderer } = stage

const lightProbe = new LightProbe()
scene.add(lightProbe)

const genCubeUrls = function (prefix, postfix) {
	return [
		prefix + 'px' + postfix,
		prefix + 'nx' + postfix,
		prefix + 'py' + postfix,
		prefix + 'ny' + postfix,
		prefix + 'pz' + postfix,
		prefix + 'nz' + postfix,
	]
}
const urls = genCubeUrls('/external-examples/threejs-lesson/07-light/public/textures/pisa/', '.png')

new CubeTextureLoader().load(urls, function (cubeTexture) {
	cubeTexture.colorSpace = SRGBColorSpace
	scene.background = cubeTexture
	lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture))

	const mat = new MeshStandardMaterial({
		color: 0xffffff,
		roughness: 0,
		envMap: cubeTexture,
		envMapIntensity: 2,
	})
	const sphereGeometry = new SphereGeometry(1, 36, 36)

	scene.add(new Mesh(sphereGeometry, mat))
})

stage.animate()
