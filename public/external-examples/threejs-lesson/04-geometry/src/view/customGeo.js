import {
  Mesh,
  MeshNormalMaterial,
  MeshBasicMaterial,
  BufferGeometry,
  BufferAttribute,
} from 'three'
import Stage from '../component/Stage.js'

const stage = new Stage()
const { scene } = stage

const vertices = [
  { pos: [-1, -1, 1], norm: [0, 0, 1], uv: [0, 0] },
  { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0] },
  { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1] },
  { pos: [-1, 1, 1], norm: [0, 0, 1], uv: [0, 1] },
  { pos: [1, -1, 1], norm: [0, 0, 1], uv: [1, 0] },
  { pos: [1, 1, 1], norm: [0, 0, 1], uv: [1, 1] },

  { pos: [1, -1, 1], norm: [1, 0, 0], uv: [0, 0] },
  { pos: [1, -1, -1], norm: [1, 0, 0], uv: [1, 0] },
  { pos: [1, 1, 1], norm: [1, 0, 0], uv: [0, 1] },
  { pos: [1, 1, 1], norm: [1, 0, 0], uv: [0, 1] },
  { pos: [1, -1, -1], norm: [1, 0, 0], uv: [1, 0] },
  { pos: [1, 1, -1], norm: [1, 0, 0], uv: [1, 1] },

  { pos: [1, -1, -1], norm: [0, 0, -1], uv: [0, 0] },
  { pos: [-1, -1, -1], norm: [0, 0, -1], uv: [1, 0] },
  { pos: [1, 1, -1], norm: [0, 0, -1], uv: [0, 1] },
  { pos: [1, 1, -1], norm: [0, 0, -1], uv: [0, 1] },
  { pos: [-1, -1, -1], norm: [0, 0, -1], uv: [1, 0] },
  { pos: [-1, 1, -1], norm: [0, 0, -1], uv: [1, 1] },

  { pos: [-1, -1, -1], norm: [-1, 0, 0], uv: [0, 0] },
  { pos: [-1, -1, 1], norm: [-1, 0, 0], uv: [1, 0] },
  { pos: [-1, 1, -1], norm: [-1, 0, 0], uv: [0, 1] },
  { pos: [-1, 1, -1], norm: [-1, 0, 0], uv: [0, 1] },
  { pos: [-1, -1, 1], norm: [-1, 0, 0], uv: [1, 0] },
  { pos: [-1, 1, 1], norm: [-1, 0, 0], uv: [1, 1] },

  { pos: [1, 1, -1], norm: [0, 1, 0], uv: [0, 0] },
  { pos: [-1, 1, -1], norm: [0, 1, 0], uv: [1, 0] },
  { pos: [1, 1, 1], norm: [0, 1, 0], uv: [0, 1] },
  { pos: [1, 1, 1], norm: [0, 1, 0], uv: [0, 1] },
  { pos: [-1, 1, -1], norm: [0, 1, 0], uv: [1, 0] },
  { pos: [-1, 1, 1], norm: [0, 1, 0], uv: [1, 1] },

  { pos: [1, -1, 1], norm: [0, -1, 0], uv: [0, 0] },
  { pos: [-1, -1, 1], norm: [0, -1, 0], uv: [1, 0] },
  { pos: [1, -1, -1], norm: [0, -1, 0], uv: [0, 1] },
  { pos: [1, -1, -1], norm: [0, -1, 0], uv: [0, 1] },
  { pos: [-1, -1, 1], norm: [0, -1, 0], uv: [1, 0] },
  { pos: [-1, -1, -1], norm: [0, -1, 0], uv: [1, 1] },
]

const positions = []
const normals = []
const uvs = []
for (const vertex of vertices) {
  positions.push(...vertex.pos)
  normals.push(...vertex.norm)
  uvs.push(...vertex.uv)
}

const geometry = new BufferGeometry()
geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))

{
  const material = new MeshNormalMaterial({
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
  const cube = new Mesh(geometry, material)
  scene.add(cube)
}
{
  const material = new MeshBasicMaterial({ wireframe: true })
  const cube = new Mesh(geometry, material)
  scene.add(cube)
}

stage.animate()
