import {
	BufferAttribute,
	BufferGeometry,
	Mesh,
	MeshBasicMaterial,
} from 'three'
import Stage from '../component/Stage.js'

/* 快速初始化项目 */
const stage = new Stage(0, 0, 10)
const { scene, camera, renderer } = stage

/* 顶点 */
const vertices = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])
/* 颜色 */
const colors = new Float32Array([0, 1, 0, 1, 1, 0, 1, -1, 0])
/* 自定义几何体 */
const geo = new BufferGeometry()
geo.setAttribute('position', new BufferAttribute(vertices, 3))
geo.setAttribute('color', new BufferAttribute(colors, 3))
/* 材质-顶点着色 */
const mat = new MeshBasicMaterial({
	color: 0xffffff,
	vertexColors: true,
})
const mesh = new Mesh(geo, mat)
scene.add(mesh)

stage.animate()
