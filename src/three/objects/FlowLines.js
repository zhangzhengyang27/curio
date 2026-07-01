import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { lon2xyz } from '../geo/coord.js'
import { dashedLineShaders } from '../utils/shaders.js'

/**
 * 计算球面两点间的大圆弧中心角（弧度）
 */
function centralAngle(start, end) {
  return start.angleTo(end)
}

/**
 * 根据选项和中心角计算弧线高度倍率
 * - arcAltitude: 相对 R 的高度倍率
 * - arcAltitudeAutoScale: 根据中心角自动加高，角度越大飞得越高
 */
function resolveAltitude(options, angle) {
  let altitude = options.arcAltitude
  let autoScale = options.arcAltitudeAutoScale

  // 兼容旧选项 arcHeight：旧行为默认固定高度
  if (altitude === undefined && options.arcHeight !== undefined) {
    altitude = options.arcHeight
    if (autoScale === undefined) autoScale = false
  }

  if (altitude === undefined) altitude = 1.15
  if (autoScale === undefined) autoScale = true

  if (autoScale) {
    const t = Math.min(angle / Math.PI, 1.0)
    altitude = altitude * (1 + 0.6 * t)
  }

  return Math.max(altitude, 1.0001)
}

/**
 * 构造颜色解析函数
 * 支持：
 * - 新 arcColor：单一颜色 / [start, end] / function
 * - 旧 color：单一颜色
 * - 旧 colorRange + valueRange：按 value 映射颜色
 */
function buildColorResolver(options, data) {
  if (options.colorRange) {
    const c1 = new THREE.Color(options.colorRange[0])
    const c2 = new THREE.Color(options.colorRange[1])
    let vMin = options.valueRange?.[0] ?? Infinity
    let vMax = options.valueRange?.[1] ?? -Infinity

    if (!options.valueRange && data.some(d => d.value !== undefined)) {
      data.forEach(d => {
        if (d.value == null) return
        if (d.value < vMin) vMin = d.value
        if (d.value > vMax) vMax = d.value
      })
    }

    return (flow) => {
      const t = (vMax > vMin) ? (flow.value - vMin) / (vMax - vMin) : 0.5
      return c1.clone().lerp(c2, t)
    }
  }

  const base = options.arcColor !== undefined ? options.arcColor : options.color
  if (typeof base === 'function') return base
  return () => base
}

/**
 * 将颜色解析结果转为顶点颜色数组
 */
function toVertexColors(resolved, count) {
  const startColor = new THREE.Color(Array.isArray(resolved) ? resolved[0] : resolved)
  const endColor = new THREE.Color(Array.isArray(resolved) ? resolved[1] : resolved)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0
    c.copy(startColor).lerp(endColor, t)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  return colors
}

/**
 * 创建自定义虚线 ShaderMaterial（用于普通 THREE.Line，uv.x 兼容路径）
 */
function createDashedShaderMaterial({ opacity, dashLength, dashGap, arcLength, initialGap }) {
  const total = dashLength + dashGap
  const dashSize = total > 0 ? (dashLength / arcLength) : 0.1
  const gapSize = total > 0 ? (dashGap / arcLength) : 0.1

  // 使用 shaders.js 的片段着色器逻辑，但 vertex 保持 uv 兼容
  const { fragmentShader } = dashedLineShaders()

  return new THREE.ShaderMaterial({
    uniforms: {
      dashOffset: { value: 0 },
      dashSize: { value: dashSize },
      gapSize: { value: gapSize },
      dashTranslate: { value: initialGap },
      opacity: { value: opacity }
    },
    vertexShader: `
      attribute vec2 uv;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vRelDistance;
      uniform float dashTranslate;
      void main() {
        vColor = color;
        vRelDistance = uv.x + dashTranslate;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: fragmentShader
      .replace('vec4 vColor;', 'vec3 vColor;')
      .replace('gl_FragColor = vColor;', 'gl_FragColor = vec4(vColor, opacity);'),
    transparent: true,
    depthTest: true,
    depthWrite: false
  })
}

/**
 * 飞线图层 — 球面两点间弧线
 * @param {Array} data - [{ from: {lon,lat}, to: {lon,lat}, value }]
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {TWEEN.Group} [options.tweenGroup] - 可选共享 Tween 组（当前未使用，预留）
 * @returns {THREE.Group}
 */
export function createFlowLines(data, R, options = {}) {
  const {
    arcCurveResolution = options.segments ?? 64,
    arcStroke = 1,
    arcDashLength = 0,
    arcDashGap = 0,
    arcDashAnimateTime = 2000,
    arcDashInitialGap = 0,
    opacity = 0.7,
    tweenGroup = null
  } = options

  const group = new THREE.Group()
  group.userData.tweenGroup = tweenGroup
  const dashed = arcDashLength > 0 && arcDashGap > 0 && arcDashAnimateTime > 0
  const colorResolver = buildColorResolver(options, data)
  const meta = { items: [] }
  group.userData.flowLines = meta

  data.forEach((flow, index) => {
    const from = lon2xyz(R, flow.from.lon, flow.from.lat)
    const to = lon2xyz(R, flow.to.lon, flow.to.lat)

    const start = new THREE.Vector3(from.x, from.y, from.z)
    const end = new THREE.Vector3(to.x, to.y, to.z)
    const angle = centralAngle(start, end)
    const altitude = resolveAltitude(options, angle)

    const mid = start.clone().add(end).multiplyScalar(0.5)
    mid.normalize().multiplyScalar(R * altitude)

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const points = curve.getPoints(arcCurveResolution)
    const count = points.length

    // 颜色
    const resolvedColor = colorResolver(flow, index)
    const colors = toVertexColors(resolvedColor, count)

    // 弧长（用于虚线间距）
    let arcLength = 0
    for (let i = 1; i < count; i++) {
      arcLength += points[i].distanceTo(points[i - 1])
    }

    // relDistance（沿弧线 0 -> 1），兼容新旧 shader
    const uvs = new Float32Array(count * 2)
    let cumulative = 0
    for (let i = 0; i < count; i++) {
      uvs[i * 2] = arcLength > 0 ? cumulative / arcLength : 0
      uvs[i * 2 + 1] = 0
      if (i < count - 1) cumulative += points[i + 1].distanceTo(points[i])
    }

    let line
    const phase = ((index * arcDashInitialGap) % 1 + 1) % 1

    if (arcStroke > 1) {
      // 使用 Line2 绘制可变宽度的线
      const geometry = new LineGeometry()
      const positions = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = points[i].x
        positions[i * 3 + 1] = points[i].y
        positions[i * 3 + 2] = points[i].z
      }
      geometry.setPositions(positions)
      geometry.setColors(colors)
      if (typeof geometry.computeLineDistances === 'function') {
        geometry.computeLineDistances()
      }

      const material = new LineMaterial({
        color: 0xffffff,
        linewidth: arcStroke,
        vertexColors: true,
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false,
        resolution: new THREE.Vector2(
          typeof window !== 'undefined' ? window.innerWidth : 1024,
          typeof window !== 'undefined' ? window.innerHeight : 768
        )
      })

      if (dashed) {
        material.dashed = true
        material.dashSize = arcDashLength
        material.gapSize = arcDashGap
        meta.items.push({
          type: 'line2',
          material,
          initial: phase * (arcDashLength + arcDashGap),
          speed: (arcDashLength + arcDashGap) / arcDashAnimateTime
        })
      }

      line = new Line2(geometry, material)
    } else {
      // 普通 THREE.Line
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      let material
      if (dashed) {
        material = createDashedShaderMaterial({
          opacity,
          dashLength: arcDashLength,
          dashGap: arcDashGap,
          arcLength,
          initialGap: phase
        })
        meta.items.push({
          type: 'line',
          material,
          initial: phase,
          speed: 1 / arcDashAnimateTime
        })
      } else {
        material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          vertexColors: true,
          transparent: true,
          opacity,
          depthTest: true,
          depthWrite: false
        })
      }

      line = new THREE.Line(geometry, material)
    }

    group.add(line)
  })

  return group
}

/**
 * 虚线飞线动画控制器
 * @param {THREE.Group} flowGroup
 * @param {number} R
 * @returns {object} { update(time), dispose() }
 */
export function animateFlowLines(flowGroup, _R) {
  const meta = flowGroup?.userData?.flowLines?.items || []

  function update(time) {
    meta.forEach(item => {
      if (item.type === 'line') {
        item.material.uniforms.dashTranslate.value = (item.initial + time * item.speed) % 1
      } else if (item.type === 'line2') {
        item.material.dashOffset = item.initial + time * item.speed
      }
    })
  }

  function dispose() {
    meta.length = 0
  }

  return { update, dispose }
}

/**
 * 流动粒子沿飞线动画（旧接口，保留兼容）
 * @param {THREE.Group} flowGroup
 * @param {number} R
 * @returns {object} { update(time), dispose() }
 */
export function animateFlowParticles(flowGroup, _R) {
  const particles = []
  flowGroup.children.forEach(line => {
    if (line.isLine) {
      const points = line.geometry.attributes.position
      const _count = points.count
      const particle = {
        mesh: createParticle(),
        line,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.005
      }
      particles.push(particle)
      flowGroup.parent?.add(particle.mesh)
    }
  })

  function createParticle() {
    const geo = new THREE.SphereGeometry(1.2, 4, 4)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })
    return new THREE.Mesh(geo, mat)
  }

  function update(_time) {
    particles.forEach(p => {
      const pts = p.line.geometry.attributes.position
      const count = pts.count
      p.progress += p.speed
      if (p.progress > 1) p.progress = 0
      const idx = Math.floor(p.progress * (count - 1))
      p.mesh.position.set(pts.getX(idx), pts.getY(idx), pts.getZ(idx))
    })
  }

  function dispose() {
    particles.forEach(p => {
      p.mesh.removeFromParent()
      p.mesh.geometry.dispose()
      p.mesh.material.dispose()
    })
    particles.length = 0
  }

  return { update, dispose }
}

// ============================================================
//  新增：弧线对象（支持自动高度、虚线流动、Tube 静态管线）
// ============================================================

/**
 * Haversine 公式计算两点中心角（弧度）
 * @param {number} lat1 起点纬度（度）
 * @param {number} lon1 起点经度（度）
 * @param {number} lat2 终点纬度（度）
 * @param {number} lon2 终点经度（度）
 */
function haversine(lat1, lon1, lat2, lon2) {
  const rlat1 = lat1 * Math.PI / 180
  const rlat2 = lat2 * Math.PI / 180
  const dLat = rlat2 - rlat1
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return c
}

/**
 * 从数据项提取端点坐标
 * 支持 { from: {lon,lat}, to: {lon,lat} }
 * 或 { startLat, startLon, endLat, endLon }
 */
function getArcEndpoints(R, item) {
  let startLat, startLon, endLat, endLon

  if (item.from && item.to) {
    startLon = item.from.lon
    startLat = item.from.lat
    endLon = item.to.lon
    endLat = item.to.lat
  } else if (
    item.startLat !== undefined &&
    item.startLon !== undefined &&
    item.endLat !== undefined &&
    item.endLon !== undefined
  ) {
    startLat = item.startLat
    startLon = item.startLon
    endLat = item.endLat
    endLon = item.endLon
  } else {
    throw new Error(
      'Arc data must have either {from,to} with {lon,lat} or {startLat,startLon,endLat,endLon}'
    )
  }

  const start = lon2xyz(R, startLon, startLat)
  const end = lon2xyz(R, endLon, endLat)

  return {
    start: new THREE.Vector3(start.x, start.y, start.z),
    end: new THREE.Vector3(end.x, end.y, end.z),
    startLat,
    startLon,
    endLat,
    endLon
  }
}

/**
 * 解析弧线高度
 * - arcAltitude: 固定高度倍率（峰值半径 = R * arcAltitude）
 * - arcAltitudeAutoScale: 自动按中心角缩放（峰值半径 = R * (1 + scale * angle)）
 */
function resolveArcAltitude(R, angle, options) {
  if (options.arcAltitude !== undefined) {
    return Math.max(options.arcAltitude, 1.0001)
  }

  const scale = options.arcAltitudeAutoScale !== undefined ? options.arcAltitudeAutoScale : 0.5
  return Math.max(1 + scale * angle, 1.0001)
}

/**
 * 解析弧线颜色（支持单一颜色、渐变数组、函数）
 */
function resolveArcColor(options, item, index) {
  const base = options.color !== undefined ? options.color : options.arcColor
  if (typeof base === 'function') return base(item, index)
  return base ?? 0xffffff
}

/**
 * 构造沿弧线 0->1 的顶点颜色数组
 */
function buildArcVertexColors(startColorHex, endColorHex, count) {
  const startColor = new THREE.Color(startColorHex)
  const endColor = new THREE.Color(endColorHex)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0
    c.copy(startColor).lerp(endColor, t)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  return colors
}

/**
 * 创建弧线自定义虚线 ShaderMaterial（mode: 'line'）
 * 使用 shared shaders.js 中的 dashedLineShaders
 */
function createArcLineMaterial({ dashSize, gapSize, dashOffset, opacity, initialTranslate }) {
  const { uniforms, vertexShader, fragmentShader } = dashedLineShaders()

  return new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      dashSize: { value: dashSize },
      gapSize: { value: gapSize },
      dashOffset: { value: dashOffset },
      dashTranslate: { value: initialTranslate },
      opacity: { value: opacity }
    },
    vertexShader: vertexShader
      .replace('attribute vec4 color;', 'attribute vec3 color;')
      .replace('varying vec4 vColor;', 'varying vec3 vColor;'),
    fragmentShader: fragmentShader
      .replace('vec4 vColor;', 'vec3 vColor;')
      .replace('gl_FragColor = vColor;', 'gl_FragColor = vec4(vColor, opacity);'),
    transparent: true,
    depthTest: true,
    depthWrite: false
  })
}

/**
 * 创建球面弧线组
 * @param {Array} data - 每条数据含 from/to 或 startLat/startLon/endLat/endLon
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {string} [options.mode='line'] - 'line' | 'tube'
 * @param {number} [options.segments=64] - 曲线采样段数
 * @param {number} [options.arcAltitude] - 固定高度倍率（覆盖自动缩放）
 * @param {number} [options.arcAltitudeAutoScale=0.5] - 按中心角自动缩放
 * @param {number|string|Array|Function} [options.color=0xffffff] - 单一/渐变/函数
 * @param {number} [options.opacity=0.7]
 * @param {number} [options.dashSize=0.1] - 虚线Dash占弧长比例（mode='line'）
 * @param {number} [options.gapSize=0.05] - 虚线Gap占弧长比例（mode='line'）
 * @param {number} [options.dashOffset=0] - 初始相位
 * @param {number} [options.dashAnimateTime=2000] - 完成一次流动周期的时间（ms）
 * @param {number} [options.dashSpeed] - 直接指定流动速度（覆盖 dashAnimateTime）
 * @param {number} [options.tubeRadius=0.3] - Tube 半径（mode='tube'）
 * @param {number} [options.tubeRadialSegments=8] - Tube 径向分段（mode='tube'）
 * @param {TWEEN.Group} [options.tweenGroup] - 可选共享 Tween 组（当前未使用，预留）
 * @returns {THREE.Group}
 */
export function createArcLines(data, R, options = {}) {
  const {
    mode = 'line',
    segments = 64,
    opacity = 0.7,
    dashSize = 0.1,
    gapSize = 0.05,
    dashOffset = 0,
    dashAnimateTime = 2000,
    dashSpeed,
    tubeRadius = 0.3,
    tubeRadialSegments = 8,
    tweenGroup = null
  } = options

  const group = new THREE.Group()
  group.userData.tweenGroup = tweenGroup
  const meta = { items: [] }
  group.userData.arcLines = meta

  data.forEach((item, index) => {
    const { start, end, startLat, startLon, endLat, endLon } = getArcEndpoints(R, item)
    const angle = haversine(startLat, startLon, endLat, endLon)
    const altitude = resolveArcAltitude(R, angle, options)

    // 控制点：大圆弧中点方向，抬升到峰值高度
    // 使用 CubicBezierCurve3 获得比 Quadratic 更平滑的弧线
    let midDir = start.clone().add(end)
    if (midDir.lengthSq() < 1e-12) {
      // 对跖点：任取一个与端点垂直的方向作为大圆弧中点
      const up = new THREE.Vector3(0, 1, 0)
      midDir.copy(start).cross(up).normalize()
      if (midDir.lengthSq() < 1e-12) {
        midDir.set(1, 0, 0)
      }
    }
    midDir.normalize()

    const arcHeight = R * altitude
    const cp1 = start.clone().lerp(end, 1 / 3).normalize().multiplyScalar(arcHeight)
    const cp2 = start.clone().lerp(end, 2 / 3).normalize().multiplyScalar(arcHeight)

    const curve = new THREE.CubicBezierCurve3(start, cp1, cp2, end)

    if (mode === 'tube') {
      // Tube 模式：较粗的静态弧线
      const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, tubeRadialSegments, false)
      const count = geometry.attributes.position.count

      const resolved = resolveArcColor(options, item, index)
      const startColorHex = Array.isArray(resolved) ? resolved[0] : resolved
      const endColorHex = Array.isArray(resolved) ? resolved[1] : resolved
      const colors = buildArcVertexColors(startColorHex, endColorHex, segments + 1)

      // Tube 每个横截面有 tubeRadialSegments+1 个顶点，需扩展颜色
      const expandedColors = new Float32Array(count * 3)
      const ringSize = tubeRadialSegments + 1
      for (let i = 0; i <= segments; i++) {
        const ci = i * 3
        for (let j = 0; j < ringSize; j++) {
          const vi = (i * ringSize + j) * 3
          expandedColors[vi] = colors[ci]
          expandedColors[vi + 1] = colors[ci + 1]
          expandedColors[vi + 2] = colors[ci + 2]
        }
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(expandedColors, 3))

      const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity,
        depthTest: true,
        depthWrite: false
      })

      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
      return
    }

    // line 模式
    const points = curve.getPoints(segments)
    const count = points.length

    const resolved = resolveArcColor(options, item, index)
    const startColorHex = Array.isArray(resolved) ? resolved[0] : resolved
    const endColorHex = Array.isArray(resolved) ? resolved[1] : resolved
    const colors = buildArcVertexColors(startColorHex, endColorHex, count)

    const relDistances = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      relDistances[i] = count > 1 ? i / (count - 1) : 0
    }

    const material = createArcLineMaterial({
      dashSize,
      gapSize,
      dashOffset,
      opacity,
      initialTranslate: (index * 0.07) % 1
    })

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('relDistance', new THREE.BufferAttribute(relDistances, 1))

    const line = new THREE.Line(geometry, material)
    group.add(line)

    const speed = dashSpeed !== undefined
      ? dashSpeed
      : 1 / Math.max(dashAnimateTime, 1)

    meta.items.push({
      material,
      initial: material.uniforms.dashTranslate.value,
      speed
    })
  })

  return group
}

/**
 * 弧线虚线流动动画控制器
 * @param {THREE.Group} arcsGroup - createArcLines 返回的组
 * @returns {object} { update(time), dispose() }
 */
export function animateArcDashes(arcsGroup) {
  const meta = arcsGroup?.userData?.arcLines?.items || []

  function update(time) {
    meta.forEach(item => {
      item.material.uniforms.dashTranslate.value = (item.initial + time * item.speed) % 1
    })
  }

  function dispose() {
    meta.length = 0
  }

  return { update, dispose }
}
