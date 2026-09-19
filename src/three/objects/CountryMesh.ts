import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { lon2xyz } from '../geo/coord'
import { gridPoint } from '../geo/gridPoints'
import { delaunay } from '../geo/triangulation'

/**
 * 生成一个国家球面Mesh
 * @param R - 球面半径
 * @param polygonArr - 多边形坐标数组（MultiPolygon 结构）
 * @returns THREE.Mesh
 */
export function countryMesh(R: number, polygonArr: number[][][][]): THREE.Mesh {
  const geometryArr: THREE.BufferGeometry[] = []

  polygonArr.forEach(obj => {
    const polygon = obj[0]
    const pointsArr = gridPoint(polygon)
    const trianglesIndexArr = delaunay(pointsArr, polygon)

    const spherePointsArr: number[] = []
    pointsArr.forEach(item => {
      const pos = lon2xyz(R, item[0], item[1])
      spherePointsArr.push(pos.x, pos.y, pos.z)
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(trianglesIndexArr), 1))
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spherePointsArr), 3))
    geometryArr.push(geometry)
  })

  let newGeometry: THREE.BufferGeometry
  if (geometryArr.length === 1) {
    newGeometry = geometryArr[0]
  } else {
    // mergeGeometries 在几何体属性不一致时可能返回 null（与原实现行为一致）
    newGeometry = mergeGeometries(geometryArr) as THREE.BufferGeometry
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
