import {
	Color,
	EquirectangularReflectionMapping,
	Mesh,
	MeshPhysicalMaterial,
	SphereGeometry,
	TextureLoader,
} from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Stage from '../component/Stage.js'

/* 快速初始化项目 */
const stage = new Stage(0, 3, 6)
const { scene, camera, renderer } = stage
// 背景色
renderer.setClearColor(0xaaaaaa)

/* 环境光 */
new RGBELoader().loadAsync('/external-examples/threejs-lesson/06-materials/public/textures/environment/shop.hdr').then((texture) => {
	texture.mapping = EquirectangularReflectionMapping
	scene.environment = texture
	scene.background = texture
})

/* 贴图 */
const textureLoader = new TextureLoader()
const marbleTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/stone/marble-01.jpg')
const stripeTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/stripe.jpg')
const ballBumpTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/bump.jpg')
const ballDisplacementTexture = textureLoader.load(
	'/external-examples/threejs-lesson/06-materials/public/textures/ball/displacement.jpg'
)
const ballNormalTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/normal.jpg')
const alphaTexture = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/alpha2.jpg')
const alphaTexture3 = textureLoader.load('/external-examples/threejs-lesson/06-materials/public/textures/ball/alpha3.png')

/* 几何体 */
const sphereGeometry = new SphereGeometry(1, 36, 36)

/* 材质 */
const mat = new MeshPhysicalMaterial()
// 透明涂层的强度
mat.clearcoat = 1
// 凹凸
// mat.bumpMap = marbleTexture
// mat.bumpScale = 0.02
// 透明涂层强度贴图
// mat.clearcoatMap = stripeTexture
// 透明图层法线贴图
// mat.clearcoatNormalMap = ballNormalTexture
// 透明图层法线的强度
// mat.clearcoatNormalScale = new Vector2(0.5, 0.5)

// 透明涂层的粗糙度
// mat.clearcoatRoughness = 1
// 颜色
// mat.color = new Color('red')
// 辉光颜色
// mat.sheenColor = new Color('yellow')
// 辉光强度
// mat.sheen = 1
// 辉光粗糙度
// mat.sheenRoughness = 0
// 透射度
// mat.transmission = 1
// mat.opacity = 0

// 使用透明度贴图
// mat.transparent = true
// mat.side = DoubleSide
// mat.alphaMap = alphaTexture

// 透射率贴图
// mat.transmissionMap = stripeTexture

// 非金属材质折射率
// 玻璃
// mat.ior = 1.5
// 冰
// mat.ior = 1.3

//反射率
// mat.reflectivity = 0.3

// 高光强度
mat.specularIntensity = 10

// 高光贴图
mat.specularIntensityMap = alphaTexture3

// 高光颜色
mat.specularColor = new Color('red')

scene.add(new Mesh(sphereGeometry, mat))

/* 灯光 */
/* const light = new DirectionalLight(0xffffff, 0.5)
light.position.set(10, 10, 10)
scene.add(light) */

stage.animate()
