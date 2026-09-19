import * as THREE from 'three'
import { lon2xyz } from '../geo/coord'

/**
 * 渲染一个国家边界线
 * @param R - 球面半径
 * @param polygonArr - 多边形坐标数组（MultiPolygon 结构）
 * @returns THREE.Group
 */
export function countryLine(R: number, polygonArr: number[][][][]): THREE.Group {
  const group = new THREE.Group()
  polygonArr.forEach(polygon => {
    const pointArr: number[] = []
    polygon[0].forEach(elem => {
      const coord = lon2xyz(R, elem[0], elem[1])
      pointArr.push(coord.x, coord.y, coord.z)
    })
    group.add(createLineLoop(pointArr))
  })
  return group
}

function createLineLoop(pointArr: number[]): THREE.LineLoop {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array(pointArr)
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  const material = new THREE.LineBasicMaterial({ color: 0x224466, transparent: true, opacity: 0.5 })
  return new THREE.LineLoop(geometry, material)
}
