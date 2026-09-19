import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { lon2xyz } from '../geo/coord'
import { dashedLineShaders } from '../utils/shaders'

type ColorInput = string | number | THREE.Color
/** 单色 / [起,止] 渐变 / 函数 三态颜色规格 */
type ColorSpec = ColorInput | [ColorInput, ColorInput] | ((item: any, index: number) => ColorInput | [ColorInput, ColorInput])

interface LonLat {
  lon: number
  lat: number
}

interface FlowData {
  from: LonLat
  to: LonLat
  value?: number
}

/** createFlowLines 的选项（含旧选项兼容） */
export interface FlowLinesOptions {
  arcCurveResolution?: number
  /** 旧选项：曲线采样段数 */
  segments?: number
  arcStroke?: number
  arcDashLength?: number
  arcDashGap?: number
  arcDashAnimateTime?: number
  arcDashInitialGap?: number
  arcAltitude?: number
  arcAltitudeAutoScale?: boolean
  /** 旧选项：固定高度倍率 */
  arcHeight?: number
  arcColor?: ColorSpec
  color?: ColorSpec
  colorRange?: [ColorInput, ColorInput]
  valueRange?: [number, number]
  opacity?: number
  tweenGroup?: unknown
}

/** createArcLines 的选项 */
export interface ArcLinesOptions {
  mode?: 'line' | 'tube'
  /** 曲线采样段数 */
  segments?: number
  /** 固定高度倍率（覆盖自动缩放） */
  arcAltitude?: number
  /** 按中心角自动缩放 */
  arcAltitudeAutoScale?: number
  color?: ColorSpec
  arcColor?: ColorSpec
  opacity?: number
  /** 虚线Dash占弧长比例（mode='line'） */
  dashSize?: number
  /** 虚线Gap占弧长比例（mode='line'） */
  gapSize?: number
  /** 初始相位 */
  dashOffset?: number
  /** 完成一次流动周期的时间（ms） */
  dashAnimateTime?: number
  /** 直接指定流动速度（覆盖 dashAnimateTime） */
  dashSpeed?: number
  /** Tube 半径（mode='tube'） */
  tubeRadius?: number
  /** Tube 径向分段（mode='tube'） */
  tubeRadialSegments?: number
  tweenGroup?: unknown
}

/** 弧线数据：{ from,to } 或 { startLat,startLon,endLat,endLon } */
export interface ArcData {
  from?: LonLat
  to?: LonLat
  startLat?: number
  startLon?: number
  endLat?: number
  endLon?: number
  [key: string]: unknown
}

/** 虚线流动动画控制器 */
export interface FlowLinesController {
  /** time: 当前时间（秒） */
  update(time: number): void
  dispose(): void
}

interface FlowLineMetaItem {
  type: 'line' | 'line2'
  material: THREE.ShaderMaterial | LineMaterial
  initial: number
  speed: number
}

/**
 * 计算球面两点间的大圆弧中心角（弧度）
 */
function centralAngle(start: THREE.Vector3, end: THREE.Vector3): number {
  return start.angleTo(end)
}

/**
 * 根据选项和中心角计算弧线高度倍率
 * - arcAltitude: 相对 R 的高度倍率
 * - arcAltitudeAutoScale: 根据中心角自动加高，角度越大飞得越高
 */
function resolveAltitude(options: FlowLinesOptions, angle: number): number {
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
function buildColorResolver(
  options: FlowLinesOptions,
  data: FlowData[]
): (flow: FlowData, index: number) => ColorInput | [ColorInput, ColorInput] | undefined {
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
      const t = (vMax > vMin) ? ((flow.value as number) - vMin) / (vMax - vMin) : 0.5
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
function toVertexColors(resolved: ColorInput | [ColorInput, ColorInput] | undefined, count: number): Float32Array {
  // THREE.Color(undefined) 回退为白色，与原实现一致
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
function createDashedShaderMaterial(options: {
  opacity: number
  dashLength: number
  dashGap: number
  arcLength: number
  initialGap: number
}): THREE.ShaderMaterial {
  const { opacity, dashLength, dashGap, arcLength, initialGap } = options
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
 * @param data - [{ from: {lon,lat}, to: {lon,lat}, value }]
 * @param R - 地球半径
 */
export function createFlowLines(data: FlowData[], R: number, options: FlowLinesOptions = {}): THREE.Group {
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
  const meta: { items: FlowLineMetaItem[] } = { items: [] }
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

    let line: THREE.Line | Line2
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
      const geom = geometry as LineGeometry & { computeLineDistances?: () => void }
      if (typeof geom.computeLineDistances === 'function') {
        geom.computeLineDistances()
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

      let material: THREE.ShaderMaterial | THREE.LineBasicMaterial
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
 * @param flowGroup
 * @param _R - 保留兼容
 */
export function animateFlowLines(flowGroup: THREE.Group | null | undefined, _R?: number): FlowLinesController {
  const meta = (flowGroup?.userData?.flowLines?.items || []) as FlowLineMetaItem[]

  function update(time: number): void {
    meta.forEach(item => {
      if (item.type === 'line') {
        ;(item.material as THREE.ShaderMaterial).uniforms.dashTranslate.value = (item.initial + time * item.speed) % 1
      } else if (item.type === 'line2') {
        ;(item.material as LineMaterial).dashOffset = item.initial + time * item.speed
      }
    })
  }

  function dispose(): void {
    meta.length = 0
  }

  return { update, dispose }
}

/**
 * 流动粒子沿飞线动画（旧接口，保留兼容）
 * @param flowGroup
 * @param _R - 保留兼容
 */
export function animateFlowParticles(flowGroup: THREE.Group | null | undefined, _R?: number): FlowLinesController {
  const particles: Array<{ mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; line: THREE.Line; progress: number; speed: number }> = []
  flowGroup?.children.forEach(child => {
    if (child.isLine) {
      const line = child as THREE.Line
      particles.push({
        mesh: createParticle(),
        line,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.005
      })
      flowGroup.parent?.add(particles[particles.length - 1].mesh)
    }
  })

  function createParticle(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
    const geo = new THREE.SphereGeometry(1.2, 4, 4)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false })
    return new THREE.Mesh(geo, mat) as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  }

  function update(_time: number): void {
    particles.forEach(p => {
      const pts = p.line.geometry.attributes.position
      const count = pts.count
      p.progress += p.speed
      if (p.progress > 1) p.progress = 0
      const idx = Math.floor(p.progress * (count - 1))
      p.mesh.position.set(pts.getX(idx), pts.getY(idx), pts.getZ(idx))
    })
  }

  function dispose(): void {
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
 * @param lat1 起点纬度（度）
 * @param lon1 起点经度（度）
 * @param lat2 终点纬度（度）
 * @param lon2 终点经度（度）
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
function getArcEndpoints(R: number, item: ArcData): {
  start: THREE.Vector3
  end: THREE.Vector3
  startLat: number
  startLon: number
  endLat: number
  endLon: number
} {
  let startLat: number, startLon: number, endLat: number, endLon: number

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
function resolveArcAltitude(angle: number, options: ArcLinesOptions): number {
  if (options.arcAltitude !== undefined) {
    return Math.max(options.arcAltitude, 1.0001)
  }

  const scale = options.arcAltitudeAutoScale !== undefined ? options.arcAltitudeAutoScale : 0.5
  return Math.max(1 + scale * angle, 1.0001)
}

/**
 * 解析弧线颜色（支持单一颜色、渐变数组、函数）
 */
function resolveArcColor(options: ArcLinesOptions, item: ArcData, index: number): ColorInput | [ColorInput, ColorInput] {
  const base = options.color !== undefined ? options.color : options.arcColor
  if (typeof base === 'function') return base(item, index)
  return base ?? 0xffffff
}

/**
 * 构造沿弧线 0->1 的顶点颜色数组
 */
function buildArcVertexColors(startColorHex: ColorInput, endColorHex: ColorInput, count: number): Float32Array {
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
function createArcLineMaterial(options: {
  dashSize: number
  gapSize: number
  dashOffset: number
  opacity: number
  initialTranslate: number
}): THREE.ShaderMaterial {
  const { dashSize, gapSize, dashOffset, opacity, initialTranslate } = options
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
 * @param data - 每条数据含 from/to 或 startLat/startLon/endLat/endLon
 * @param R - 地球半径
 */
export function createArcLines(data: ArcData[], R: number, options: ArcLinesOptions = {}): THREE.Group {
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
  const meta: { items: Array<{ material: THREE.ShaderMaterial; initial: number; speed: number }> } = { items: [] }
  group.userData.arcLines = meta

  data.forEach((item, index) => {
    const { start, end, startLat, startLon, endLat, endLon } = getArcEndpoints(R, item)
    const angle = haversine(startLat, startLon, endLat, endLon)
    const altitude = resolveArcAltitude(angle, options)

    // 控制点：大圆弧中点方向，抬升到峰值高度
    // 使用 CubicBezierCurve3 获得比 Quadratic 更平滑的弧线
    const midDir = start.clone().add(end)
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
 * @param arcsGroup - createArcLines 返回的组
 */
export function animateArcDashes(arcsGroup: THREE.Group | null | undefined): FlowLinesController {
  const meta = (arcsGroup?.userData?.arcLines?.items || []) as Array<{ material: THREE.ShaderMaterial; initial: number; speed: number }>

  function update(time: number): void {
    meta.forEach(item => {
      item.material.uniforms.dashTranslate.value = (item.initial + time * item.speed) % 1
    })
  }

  function dispose(): void {
    meta.length = 0
  }

  return { update, dispose }
}
