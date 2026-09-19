import * as THREE from 'three'
import { lon2xyz } from '../geo/coord'
import { createRepeatableRings } from './WaveRipple'
import type { RepeatableRingsController } from './WaveRipple'

/**
 * 粒子风暴 — 螺旋运动粒子模拟台风
 * @param lon - 中心经度
 * @param lat - 中心纬度
 * @param R - 地球半径
 */
export function createStormParticles(
  lon: number,
  lat: number,
  R: number,
  options: {
    particleCount?: number
    maxRadius?: number
    color?: string | number | THREE.Color
    opacity?: number
    rotationSpeed?: number
    rings?: boolean
  } = {}
): THREE.Points | THREE.Group {
  const {
    particleCount = 500,
    maxRadius = 20,
    color = 0xffffff,
    opacity = 0.7,
    rotationSpeed = 1,
    rings = true
  } = options

  const points = createPoints(lon, lat, R, {
    particleCount,
    maxRadius,
    color,
    opacity,
    rotationSpeed
  })

  if (!rings) return points

  // 在粒子周围叠加可复用脉冲环
  const group = new THREE.Group()
  group.name = 'StormParticles'
  points.name = 'particles'
  group.add(points)

  const { group: ringsGroup, controller: ringsController } = createRepeatableRings(
    { lon, lat },
    R,
    {
      ringColor: [color, 0xffffff],
      ringMaxRadius: 25,
      ringPropagationSpeed: 8,
      ringRepeatPeriod: 1200,
      ringResolution: 64,
      ringAltitude: 0.025
    }
  )
  ringsGroup.name = 'rings'
  group.add(ringsGroup)

  group.userData = {
    points,
    ringsController,
    clock: 0,
    rotationSpeed,
    isStormGroup: true
  }

  return group
}

function createPoints(
  lon: number,
  lat: number,
  R: number,
  options: {
    particleCount?: number
    maxRadius?: number
    color?: string | number | THREE.Color
    opacity?: number
    rotationSpeed?: number
  }
): THREE.Points {
  const {
    particleCount = 500,
    maxRadius = 20,
    color = 0xffffff,
    opacity = 0.7,
    rotationSpeed = 1
  } = options

  const center = lon2xyz(R, lon, lat)
  const normal = new THREE.Vector3(center.x, center.y, center.z).normalize()

  const positions = new Float32Array(particleCount * 3)
  const userData: Array<{ angle: number; radius: number; height: number; speed: number }> = [] // 存储每个粒子的角度/半径/速度

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * maxRadius
    const height = (Math.random() - 0.5) * 10

    // 在切平面上计算位置
    const u = new THREE.Vector3(-normal.z, 0, normal.x).normalize()
    const v = new THREE.Vector3().crossVectors(normal, u).normalize()

    const px = center.x + u.x * radius * Math.cos(angle) + v.x * radius * Math.sin(angle) + normal.x * height
    const py = center.y + u.y * radius * Math.cos(angle) + v.y * radius * Math.sin(angle) + normal.y * height
    const pz = center.z + u.z * radius * Math.cos(angle) + v.z * radius * Math.sin(angle) + normal.z * height

    positions[i * 3] = px
    positions[i * 3 + 1] = py
    positions[i * 3 + 2] = pz

    userData.push({ angle, radius, height, speed: 1.5 + Math.random() * 3 })
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // 顶点颜色
  const colors = new Float32Array(particleCount * 3)
  const c = new THREE.Color(color)
  for (let i = 0; i < particleCount; i++) {
    const a = 0.5 + Math.random() * 0.5
    colors[i * 3] = c.r * a
    colors[i * 3 + 1] = c.g * a
    colors[i * 3 + 2] = c.b * a
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  points.userData = { userData, normal, center, maxRadius, rotationSpeed }
  return points
}

/**
 * 更新风暴粒子位置
 * 兼容传入 Points 或 Group（Group 时会同时更新内部粒子和脉冲环）
 */
export function updateStormParticles(obj: THREE.Points | THREE.Group | null | undefined, delta: number): void {
  if (obj?.userData?.isStormGroup) {
    const { points, ringsController, rotationSpeed } = obj.userData
    updatePoints(points as THREE.Points, delta, rotationSpeed)
    obj.userData.clock += delta
    ;(ringsController as RepeatableRingsController).update(obj.userData.clock)
    return
  }

  // 旧版兼容：直接传入 Points
  if (obj?.isPoints) {
    updatePoints(obj as THREE.Points, delta, (obj as THREE.Points).userData?.rotationSpeed ?? 1)
  }
}

function updatePoints(points: THREE.Points, delta: number, rotationSpeed = 1): void {
  const { userData: pData, normal, center } = points.userData
  const pos = points.geometry.attributes.position
  const u = new THREE.Vector3(-normal.z, 0, normal.x).normalize()
  const v = new THREE.Vector3().crossVectors(normal, u).normalize()

  for (let i = 0; i < pData.length; i++) {
    const p = pData[i]
    p.angle += delta * p.speed * rotationSpeed
    const r = p.radius * (0.9 + 0.1 * Math.sin(p.angle * 5))

    const px = center.x + u.x * r * Math.cos(p.angle) + v.x * r * Math.sin(p.angle) + normal.x * p.height
    const py = center.y + u.y * r * Math.cos(p.angle) + v.y * r * Math.sin(p.angle) + normal.y * p.height
    const pz = center.z + u.z * r * Math.cos(p.angle) + v.z * r * Math.sin(p.angle) + normal.z * p.height

    pos.setXYZ(i, px, py, pz)
  }
  pos.needsUpdate = true
}
