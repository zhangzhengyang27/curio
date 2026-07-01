import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { lon2xyz } from '../math.js'
import { gridPoint } from './gridPoint.js'
import { delaunay } from './delaunay.js'

function countryMesh(R, polygonArr) {
  const geometryArr = []
  polygonArr.forEach((obj) => {
    const polygon = obj[0]
    const pointsArr = gridPoint(polygon)
    const trianglesIndexArr = delaunay(pointsArr, polygon)
    const spherePointsArr = []
    pointsArr.forEach((item) => {
      const pos = lon2xyz(R, item[0], item[1])
      spherePointsArr.push(pos.x, pos.y, pos.z)
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(trianglesIndexArr), 1))
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spherePointsArr), 3))
    geometryArr.push(geometry)
  })

  let newGeometry = null
  if (geometryArr.length === 1) {
    newGeometry = geometryArr[0]
  } else {
    newGeometry = mergeGeometries(geometryArr)
  }
  newGeometry.computeVertexNormals()
  const material = new THREE.MeshLambertMaterial({
    color: 0x002222,
  })
  const mesh = new THREE.Mesh(newGeometry, material)
  return mesh
}

export { countryMesh }
