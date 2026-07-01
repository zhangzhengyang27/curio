import {
	Color,
	Sprite,
	SpriteMaterial,
	TextureLoader,
} from 'three'
import Stage from '../component/Stage.js'

/* 快速初始化项目 */
const stage = new Stage(0, 0, 2)
const { scene, camera, renderer } = stage
scene.background = new Color(0x00acec)

/* 粒子材质 */
const material = new SpriteMaterial({
	color: 0x00acec,
	// opacity: 0.5,
	// alphaTest: 0.6,
	alphaToCoverage: true,
})
const textureLoader = new TextureLoader()
const grassDiffLoader = textureLoader.loadAsync(
	'/external-examples/threejs-lesson/06-materials/public/textures/grass/grass-diff.jpg'
)
const grassMaskLoader = textureLoader.loadAsync(
	'/external-examples/threejs-lesson/06-materials/public/textures/grass/grass-mask.jpg'
)
Promise.all([grassDiffLoader, grassMaskLoader]).then((textures) => {
	material.map = textures[0]
	material.alphaMap = textures[1]
})

/* 粒子对象 */
const sprite = new Sprite(material)
scene.add(sprite)

stage.animate()
