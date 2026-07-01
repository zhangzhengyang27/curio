import {
  Mesh,
  MeshNormalMaterial,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage(0, 0, 4)
const { scene } = stage

const shape = new Shape()
shape.moveTo(0, 0)
shape.bezierCurveTo(1, 1, -1, 1, 0, 0)
const geometry = new ShapeGeometry(shape, 6)

{
  const material = new MeshNormalMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  const mesh = new Mesh(geometry, material)
  scene.add(mesh)
}
{
  const material = new MeshBasicMaterial({ wireframe: true })
  const mesh = new Mesh(geometry, material)
  scene.add(mesh)
}

stage.animate()
