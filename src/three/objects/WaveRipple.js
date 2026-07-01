import * as THREE from 'three'
import { lon2xyz } from '../geo/coord.js'

/**
 * 波动光圈 — 从源点扩散的波纹动画（旧版 API，保留向后兼容）
 * @param {object} origin - { lon, lat }
 * @param {number} R - 地球半径
 * @param {object} options - { color, maxRadius, speed, ringWidth, tweenGroup }
 * @param {TWEEN.Group} [options.tweenGroup] - 可选共享 Tween 组（当前未使用，预留）
 * @returns {THREE.Group}
 */
export function createWaveRipple(origin, R, options = {}) {
  const {
    color = 0xff4444,
    maxRadius = 80,
    speed = 0.5,
    ringWidth = 3,
    tweenGroup = null
  } = options

  const pos = lon2xyz(R, origin.lon, origin.lat)
  const dir = new THREE.Vector3(pos.x, pos.y, pos.z).normalize()
  const group = new THREE.Group()
  group.userData.tweenGroup = tweenGroup

  // 源点小球
  const dotGeo = new THREE.SphereGeometry(2, 8, 8)
  const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  dot.position.copy(dir.clone().multiplyScalar(R * 1.01))
  group.add(dot)

  // 波动光圈（最多3层）
  const rings = []
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(2, ringWidth, 8, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.copy(dir.clone().multiplyScalar(R * 1.01))
    ring.lookAt(new THREE.Vector3(0, 0, 0))
    ring.visible = false
    ring.userData = { phase: i * 0.33, speed: speed * (0.8 + i * 0.2) }
    group.add(ring)
    rings.push(ring)
  }

  group.userData = { rings, maxRadius, speed }

  return group
}

/**
 * 更新所有波动光圈（旧版 API，保留向后兼容）
 * @param {THREE.Group} rippleGroup
 * @param {number} time - 当前时间(s)
 */
export function updateWaveRipples(rippleGroup, time) {
  if (!rippleGroup.userData?.rings) return

  rippleGroup.userData.rings.forEach(ring => {
    const { phase, speed: sp } = ring.userData
    const t = (time * sp + phase) % 1.0
    const scale = rippleGroup.userData.maxRadius * t / 5
    const opacity = t < 0.1 ? t * 6 : (1 - t) * 0.7

    if (scale > 1) {
      ring.visible = true
      ring.scale.setScalar(Math.min(scale, rippleGroup.userData.maxRadius))
      ring.material.opacity = Math.max(opacity, 0)
    } else {
      ring.visible = false
    }
  })
}

/**
 * 简单圆形线几何体（XY 平面，单位圆）
 * @param {number} radius
 * @param {number} segments
 * @returns {THREE.BufferGeometry}
 */
function CircleLineGeometry(radius, segments = 64) {
  const points = []
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(
      radius * Math.cos(theta),
      radius * Math.sin(theta),
      0
    ))
  }
  return new THREE.BufferGeometry().setFromPoints(points)
}

function normalizeColor(c) {
  if (c instanceof THREE.Color) return c.clone()
  return new THREE.Color(c)
}

/**
 * 创建可复用脉冲环控制器
 * @param {object|object[]} data - 源点 { lon, lat } 或源点数组
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {number} [options.ringMaxRadius=20] - 最大环半径（角度制）
 * @param {number} [options.ringPropagationSpeed=5] - 扩展速度（角度/秒）
 * @param {number} [options.ringRepeatPeriod=2000] - 新环发射间隔（毫秒）
 * @param {number|number[]|THREE.Color|THREE.Color[]} [options.ringColor=0xff4444] - 单色或渐变色数组
 * @param {number} [options.ringResolution=64] - 圆的分段数
 * @param {number} [options.ringAltitude=0.02] - 高于球面的高度（R 的倍数）
 * @param {TWEEN.Group} [options.tweenGroup] - 可选共享 Tween 组（当前未使用，预留）
 * @returns {{ group: THREE.Group, controller: { update: Function, dispose: Function } }}
 */
export function createRepeatableRings(data, R, options = {}) {
  const {
    ringMaxRadius = 20,
    ringPropagationSpeed = 5,
    ringRepeatPeriod = 2000,
    ringColor = 0xff4444,
    ringResolution = 64,
    ringAltitude = 0.02,
    tweenGroup = null
  } = options

  const origins = Array.isArray(data) ? data : [data]
  const colors = Array.isArray(ringColor)
    ? ringColor.map(normalizeColor)
    : [normalizeColor(ringColor)]
  const effectiveR = R * (1 + ringAltitude)
  const repeatSec = ringRepeatPeriod / 1000

  const group = new THREE.Group()
  group.name = 'RepeatableRings'

  const siteGroups = []
  origins.forEach(origin => {
    const pos = lon2xyz(effectiveR, origin.lon, origin.lat)
    const site = new THREE.Group()
    site.position.set(pos.x, pos.y, pos.z)
    site.lookAt(0, 0, 0)
    group.add(site)
    siteGroups.push(site)
  })

  // 共享的单位圆几何体，通过 scale 控制半径
  const geometry = CircleLineGeometry(1, ringResolution)

  group.userData = {
    R,
    effectiveR,
    ringMaxRadius,
    ringPropagationSpeed,
    repeatSec,
    colors,
    ringAltitude,
    geometry,
    siteGroups,
    tweenGroup
  }

  const controller = animateRepeatableRings(group)

  return { group, controller }
}

/**
 * 为已创建的脉冲环 Group 绑定动画控制器
 * @param {THREE.Group} ringsGroup
 * @returns {{ update: Function, dispose: Function }}
 */
export function animateRepeatableRings(ringsGroup) {
  const ud = ringsGroup.userData
  const {
    effectiveR,
    ringMaxRadius,
    ringPropagationSpeed,
    repeatSec,
    colors,
    geometry,
    siteGroups
  } = ud

  // 单个环从发出到消失所需时间（秒）
  const maxLife = ringMaxRadius / ringPropagationSpeed

  // 每个激活的环：{ mesh, site, startTime, active }
  const rings = []

  function emit(site, time) {
    let ring = rings.find(r => r.site === site && !r.active)

    if (!ring) {
      const material = new THREE.LineBasicMaterial({
        color: colors[0],
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
      const mesh = new THREE.LineLoop(geometry, material)
      mesh.scale.setScalar(0)
      mesh.visible = false
      site.add(mesh)
      ring = { mesh, site, startTime: 0, active: false }
      rings.push(ring)
    }

    ring.active = true
    ring.startTime = time
    ring.mesh.visible = true
    ring.mesh.material.opacity = 1
    ring.mesh.scale.setScalar(0)
    ring.mesh.material.color.copy(colors[0])
  }

  function updateRingColor(ring, progress) {
    if (colors.length < 2) {
      ring.mesh.material.color.copy(colors[0])
      return
    }
    const scaled = progress * (colors.length - 1)
    const i0 = Math.floor(scaled)
    const i1 = Math.min(i0 + 1, colors.length - 1)
    const t = scaled - i0
    ring.mesh.material.color.lerpColors(colors[i0], colors[i1], t)
  }

  let lastEmitTime = -Infinity
  let lastTime = 0

  function update(time) {
    if (lastEmitTime === -Infinity) {
      lastEmitTime = time - repeatSec
    }

    // 防止时间倒退导致异常
    if (time < lastTime) {
      lastTime = time
      lastEmitTime = time - repeatSec
    }

    // 到达周期时为每个源点发射新环
    if (time - lastEmitTime >= repeatSec) {
      siteGroups.forEach(site => emit(site, time))
      lastEmitTime = time
    }

    // 更新所有激活的环
    rings.forEach(ring => {
      if (!ring.active) return

      const age = time - ring.startTime
      const progress = age / maxLife

      if (progress >= 1) {
        ring.active = false
        ring.mesh.visible = false
        return
      }

      const theta = (progress * ringMaxRadius) * Math.PI / 180
      const radius = effectiveR * Math.tan(theta)
      ring.mesh.scale.setScalar(Math.max(radius, 0.0001))
      ring.mesh.material.opacity = Math.max(1 - progress, 0)
      updateRingColor(ring, progress)
    })

    lastTime = time
  }

  function dispose() {
    rings.forEach(r => {
      r.active = false
      if (r.mesh.material) r.mesh.material.dispose()
      if (r.mesh.parent) r.mesh.parent.remove(r.mesh)
      r.mesh.geometry = null
    })
    rings.length = 0
    if (geometry) geometry.dispose()
  }

  return { update, dispose }
}
