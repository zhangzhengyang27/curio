import {
	PointLight,
	TextureLoader,
} from 'three'
import {
	Lensflare,
	LensflareElement,
} from 'three/examples/jsm/objects/Lensflare.js'
import Stage from '../component/Stage.js'

const stage = new Stage(0, 0, 6)
const { scene, camera, renderer } = stage

const textureLoader = new TextureLoader()
const textureFlare0 = textureLoader.load('/external-examples/threejs-lesson/07-light/public/textures/lensflare/lensflare0.png')
const textureFlare3 = textureLoader.load('/external-examples/threejs-lesson/07-light/public/textures/lensflare/lensflare3.png')

const light = new PointLight(0x00acec)
light.position.set(0, 0, 2)

scene.add(light)

const lensflare = new Lensflare()
lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, light.color))
lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6))
lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7))
lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9))
lensflare.addElement(new LensflareElement(textureFlare3, 70, 1))
light.add(lensflare)

stage.animate()
