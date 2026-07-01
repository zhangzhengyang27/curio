import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { lon2xyz } from '../geo/coord.js'
import { gridPoint } from '../geo/gridPoints.js'
import { delaunay } from '../geo/triangulation.js'

/**
 * 生成一个国家球面Mesh
 * @param {number} R - 球面半径
 * @param {Array} polygonArr - 多边形坐标数组
 * @returns {THREE.Mesh}
 */
export function countryMesh(R, polygonArr) {
  const geometryArr = []

  polygonArr.forEach(obj => {
    const polygon = obj[0]
    const pointsArr = gridPoint(polygon)
    const trianglesIndexArr = delaunay(pointsArr, polygon)

    const spherePointsArr = []
    pointsArr.forEach(item => {
      const pos = lon2xyz(R, item[0], item[1])
      spherePointsArr.push(pos.x, pos.y, pos.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(trianglesIndexArr), 1))
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spherePointsArr), 3))
    geometryArr.push(geometry)
  })

  let newGeometry
  if (geometryArr.length === 1) {
    newGeometry = geometryArr[0]
  } else {
    newGeometry = mergeGeometries(geometryArr)
  }
  newGeometry.computeVertexNormals()

  const material = new THREE.MeshPhongMaterial({
    color: 0x002222,
    specular: 0x111111,
    shininess: 5,
    emissive: 0x000000,
    emissiveIntensity: 0.2
  })
  const mesh = new THREE.Mesh(newGeometry, material)
  return mesh
}
