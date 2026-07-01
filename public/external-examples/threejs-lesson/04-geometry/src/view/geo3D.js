import {
  Mesh,
  MeshNormalMaterial,
  MeshBasicMaterial,
  TorusKnotGeometry,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage()
const { scene } = stage

const geometry = new TorusKnotGeometry(0.5, 0.1, 128, 3, 8, 9)

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
