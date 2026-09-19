import * as THREE from 'three'
import { lon2xyz } from '../geo/coord'

/**
 * 光柱标注
 * @param lon - 经度
 * @param lat - 纬度
 * @param R - 地球半径
 * @param options - { height, color, baseColor, baseRadius }
 */
export function createLightPillar(
  lon: number,
  lat: number,
  R: number,
  options: {
    height?: number
    color?: string | number | THREE.Color
    opacity?: number
    width?: number
    baseRadius?: number
    baseColor?: string | number | THREE.Color
  } = {}
): THREE.Group {
  const {
    height = 30,
    color = 0x00cccc,
    opacity = 0.7,
    width = 2,
    baseRadius = 4,
    baseColor = 0x006666
  } = options

  const pos = lon2xyz(R, lon, lat)
  const dir = new THREE.Vector3(pos.x, pos.y, pos.z).normalize()
  const group = new THREE.Group()

  // 底座圆环
  const ringGeo = new THREE.TorusGeometry(baseRadius, 0.5, 8, 16)
  const ringMat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.6, depthWrite: false })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.copy(dir.clone().multiplyScalar(R * 1.005))
  ring.lookAt(new THREE.Vector3(0, 0, 0))
  group.add(ring)

  // 光柱：两个交叉平面
  const h = height
  const w = width
  const planeGeo = new THREE.PlaneGeometry(w, h)

  const p1 = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
  }))
  const p2 = new THREE.Mesh(planeGeo, p1.material.clone())

  const basePos = dir.clone().multiplyScalar(R * 1.005)
  p1.position.copy(basePos)
  p2.position.copy(basePos)

  // 面朝外
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
  p1.setRotationFromQuaternion(quat)
  p2.setRotationFromQuaternion(quat)
  p2.rotateZ(Math.PI / 2)

  // 偏移半高
  p1.position.addScaledVector(dir, h / 2)
  p2.position.addScaledVector(dir, h / 2)

  group.add(p1)
  group.add(p2)

  return group
}

/**
 * 批量创建光柱
 * @param items - [{ lon, lat, height, color }]
 * @param R
 */
export function createLightPillars(
  items: Array<{ lon: number; lat: number; height?: number; color?: string | number | THREE.Color }>,
  R: number
): THREE.Group {
  const group = new THREE.Group()
  items.forEach(item => {
    const pillar = createLightPillar(item.lon, item.lat, R, {
      height: item.height || 30,
      color: item.color || 0x00cccc
    })
    group.add(pillar)
  })
  return group
}
