import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import type { Group as TweenGroup } from '@tweenjs/tween.js'
import { lon2xyz } from '../geo/coord'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** 颜色规格：字段名 / 回调 / 常量 */
type ColorSpec = string | number | THREE.Color | ((value: number, normalized: number, item: Record<string, any>) => string | number | THREE.Color)

/** 字段/回调/常量 三态取值规格 */
type FieldSpec = string | number | boolean | ((item: Record<string, any>, fallback?: unknown) => unknown) | null | undefined

export interface CylinderOptions {
  /** 纬度字段名或回调 */
  lat?: string | ((item: Record<string, any>) => unknown)
  /** 经度字段名或回调 */
  lng?: string | ((item: Record<string, any>) => unknown)
  /** 高度字段、回调或常量（优先于 getValue/maxValue） */
  altitude?: FieldSpec
  /** 半径字段、回调或常量 */
  radius?: FieldSpec
  /** 颜色字段、回调或常量 */
  color?: ColorSpec
  opacity?: number
  /** 取值函数 */
  getValue?: (item: Record<string, any>) => number
  /** 归一化最大值（为 null 时自动计算） */
  maxValue?: number | null
  radiusScale?: number
  heightScale?: number
  minHeight?: number
  /** [低值颜色, 高值颜色] */
  colorRange?: [string | number | THREE.Color, string | number | THREE.Color] | null
  /** d3-scale 函数或回调 (value, normalized, item) => color */
  colorScale?: ((value: number, normalized: number, item: Record<string, any>) => string | number | THREE.Color) | null
  /** 是否合并几何体以提升性能 */
  merge?: boolean
  /** 圆柱体径向分段数 */
  segments?: number
  /** 生长动画时长（毫秒），非合并模式下从柱底生长 */
  transitionDuration?: number
  /** 可选的共享 Tween 组；传入时使用 TWEEN 驱动过渡动画 */
  tweenGroup?: TweenGroup | null
}

/**
 * 解析字段/回调/常量值
 * @param item - 数据项
 * @param fieldOrValue - 字段名、回调或常量
 * @param fallback - 默认值
 */
function resolveField(item: Record<string, any>, fieldOrValue: FieldSpec, fallback: any): any {
  if (typeof fieldOrValue === 'function') return fieldOrValue(item, fallback)
  if (typeof fieldOrValue === 'string') {
    const v = item[fieldOrValue]
    return v !== undefined && v !== null ? v : fallback
  }
  if (typeof fieldOrValue === 'number' || typeof fieldOrValue === 'boolean') return fieldOrValue
  if (fieldOrValue !== undefined && fieldOrValue !== null) return fieldOrValue
  return fallback
}

function resolveColor(input: unknown): THREE.Color | null {
  if (!input && input !== 0) return null
  if (input instanceof THREE.Color) return input.clone()
  if (typeof input === 'number' || typeof input === 'string') {
    try { return new THREE.Color(input) } catch { return null }
  }
  return null
}

function resolveColorSource(
  item: Record<string, any>,
  color: ColorSpec,
  defaultColor: THREE.Color,
  value: number,
  normalized: number
): THREE.Color {
  if (typeof color === 'function') {
    return resolveColor(color(value, normalized, item)) || defaultColor
  }
  if (typeof color === 'string') {
    if (color in item) return resolveColor(item[color]) || defaultColor
    return resolveColor(color) || defaultColor
  }
  return resolveColor(color) || defaultColor
}

function defaultGetValue(item: Record<string, any>): number {
  return item.value ?? item.mag ?? item.density ?? item.emission ?? item.brightness ?? item.gdp ?? item.altitude ?? 1
}

const _yAxis = new THREE.Vector3(0, 1, 0)
const _normal = new THREE.Vector3()
const _basePos = new THREE.Vector3()
const _quat = new THREE.Quaternion()

/**
 * 计算单个数据项对应的圆柱体状态
 * @param item - 数据项
 * @param R - 地球半径
 * @param computedMax - 预计算的最大值（用于归一化）
 * @param computedMin - 预计算的最小值（用于归一化）
 */
function getCylinderState(
  item: Record<string, any>,
  R: number,
  options: CylinderOptions = {},
  computedMax?: number,
  computedMin?: number
) {
  const {
    lat = 'lat',
    lng = 'lon',
    altitude = null,
    radius = null,
    color = 0xff4444,
    getValue = defaultGetValue,
    maxValue = null,
    radiusScale = 1,
    heightScale = 1,
    minHeight = 0,
    colorRange = null,
    colorScale = null,
    segments = 8
  } = options

  const latVal = Number(resolveField(item, lat, item.lat ?? 0))
  const lngVal = Number(resolveField(item, lng, item.lon ?? item.lng ?? 0))
  const value = Number(getValue(item)) || 0

  const finalMax = computedMax ?? maxValue ?? Math.max(value, 0.0001)
  const finalMin = computedMin ?? Math.min(value, 0)
  const normalized = finalMax > finalMin
    ? Math.max(0, Math.min(1, (value - finalMin) / (finalMax - finalMin)))
    : 0.5

  let height: number
  if (altitude !== null) {
    height = minHeight + Number(resolveField(item, altitude, 1)) * heightScale
  } else {
    height = minHeight + normalized * heightScale
  }

  let baseRadius = 0.5
  if (radius !== null) {
    baseRadius = Number(resolveField(item, radius, 0.5))
  }
  const finalRadius = Math.max(0.01, baseRadius * radiusScale)

  const lowColor = colorRange && colorRange.length >= 2 ? resolveColor(colorRange[0]) : null
  const highColor = colorRange && colorRange.length >= 2 ? resolveColor(colorRange[1]) : null
  const defaultColor = resolveColor(color) || new THREE.Color(0xff4444)
  const itemColor = colorScale
    ? (resolveColor(colorScale(value, normalized, item)) || defaultColor)
    : resolveColorSource(item, color, defaultColor, value, normalized)

  if (lowColor && highColor && !colorScale && typeof color !== 'function' && !(typeof color === 'string' && color in item)) {
    itemColor.copy(lowColor.clone().lerp(highColor, normalized))
  }

  const pos = lon2xyz(R, lngVal, latVal)
  // 非有限经纬度直接丢弃这一项，绝不往下写：NaN 顶点会污染同一份合并几何的
  // boundingSphere（three 会报 computeBoundingSphere radius is NaN），
  // 让整组圆柱的视锥剔除与射线拾取一起失效 —— 一条脏数据毒死一组。
  if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) return null
  _normal.set(pos.x, pos.y, pos.z).normalize()
  _basePos.copy(_normal).multiplyScalar(R * 1.002)

  _quat.setFromUnitVectors(_yAxis, _normal)

  return {
    latVal,
    lngVal,
    value,
    normalized,
    height,
    finalRadius,
    itemColor,
    position: _basePos.clone(),
    quaternion: _quat.clone(),
    segments: Math.max(3, segments)
  }
}

interface CylinderMeshUserData {
  item: Record<string, any>
  value: number
  normalized: number
  height: number
  radius: number
  transitionTweens: Array<TWEEN.Tween<object>>
}

/**
 * 为单个数据项创建圆柱体 Mesh
 * @param item - 数据项
 * @param R - 地球半径
 */
export function createCylinderForItem(item: Record<string, any>, R: number, options: CylinderOptions = {}): THREE.Mesh | null {
  const {
    opacity = 0.9,
    transitionDuration = 0,
    tweenGroup = null
  } = options

  const state = getCylinderState(item, R, options)
  if (!state) return null

  const geometry = new THREE.CylinderGeometry(state.finalRadius, state.finalRadius, state.height, state.segments, 1)
  geometry.translate(0, state.height / 2, 0)
  geometry.applyQuaternion(state.quaternion)
  geometry.translate(state.position.x, state.position.y, state.position.z)

  const material = new THREE.MeshBasicMaterial({
    color: state.itemColor,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = { item, value: state.value, normalized: state.normalized, height: state.height, radius: state.finalRadius, transitionTweens: [] } satisfies CylinderMeshUserData

  if (transitionDuration > 0 && tweenGroup) {
    mesh.scale.y = 0
    const progress = { y: 0 }
    const tween = new TWEEN.Tween(progress, tweenGroup)
      .to({ y: 1 }, transitionDuration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => { mesh.scale.y = progress.y })
      .start()
    ;(mesh.userData as CylinderMeshUserData).transitionTweens.push(tween)
  }

  return mesh
}

/**
 * 更新单个圆柱体 Mesh 到新的数据项状态
 * 若传入 tweenGroup，则对位置、缩放、颜色做平滑过渡
 * @param mesh
 * @param item
 * @param R
 */
export function updateCylinderForItem(mesh: THREE.Mesh | null | undefined, item: Record<string, any>, R: number, options: CylinderOptions = {}): THREE.Mesh | null {
  if (!mesh) return null

  const state = getCylinderState(item, R, options)
  if (!state) return null
  const newGeometry = new THREE.CylinderGeometry(state.finalRadius, state.finalRadius, state.height, state.segments, 1)
  newGeometry.translate(0, state.height / 2, 0)
  newGeometry.applyQuaternion(state.quaternion)
  newGeometry.translate(state.position.x, state.position.y, state.position.z)

  const opacity = options.opacity ?? 0.9
  const tweenGroup = options.tweenGroup || null
  const duration = options.transitionDuration ?? 500

  // three-types-fixes.d.ts 把 Material.color 并成了可选，这里收窄回必选
  const mat = mesh.material as (THREE.MeshBasicMaterial & { color: THREE.Color }) | undefined
  const oldPosition = mesh.position.clone()
  const oldScale = mesh.scale.clone()
  const oldColor = mat?.color?.clone()

  if (mesh.geometry) mesh.geometry.dispose()
  mesh.geometry = newGeometry
  mesh.quaternion.copy(state.quaternion)
  mesh.userData = { item, value: state.value, normalized: state.normalized, height: state.height, radius: state.finalRadius, transitionTweens: (mesh.userData as CylinderMeshUserData | undefined)?.transitionTweens || [] } satisfies CylinderMeshUserData

  if (mat) {
    mat.opacity = opacity
    mat.transparent = opacity < 1
  }

  if (tweenGroup && duration > 0) {
    mesh.position.copy(oldPosition)
    mesh.scale.copy(oldScale)
    if (oldColor && mat) mat.color.copy(oldColor)

    const pos = { x: oldPosition.x, y: oldPosition.y, z: oldPosition.z }
    const posTween = new TWEEN.Tween(pos, tweenGroup)
      .to({ x: state.position.x, y: state.position.y, z: state.position.z }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => mesh.position.set(pos.x, pos.y, pos.z))
      .start()
    ;(mesh.userData as CylinderMeshUserData).transitionTweens.push(posTween)

    const scl = { x: oldScale.x, y: oldScale.y, z: oldScale.z }
    const scaleTween = new TWEEN.Tween(scl, tweenGroup)
      .to({ x: 1, y: 1, z: 1 }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => mesh.scale.set(scl.x, scl.y, scl.z))
      .start()
    ;(mesh.userData as CylinderMeshUserData).transitionTweens.push(scaleTween)

    if (oldColor && mat?.color) {
      const targetColor = state.itemColor
      const col = { r: oldColor.r, g: oldColor.g, b: oldColor.b }
      const colorTween = new TWEEN.Tween(col, tweenGroup)
        .to({ r: targetColor.r, g: targetColor.g, b: targetColor.b }, duration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => mat.color.setRGB(col.r, col.g, col.b))
        .start()
      ;(mesh.userData as CylinderMeshUserData).transitionTweens.push(colorTween)
    }
  } else {
    mesh.position.copy(state.position)
    mesh.scale.set(1, 1, 1)
    if (mat) mat.color.copy(state.itemColor)
  }

  return mesh
}

/**
 * 基于圆柱体的散点图
 * 每个数据点渲染为一个沿球面法向生长的圆柱体
 *
 * @param data - 数据数组
 * @param R - 地球半径
 */
export function createCylinderScatterPoints(data: Array<Record<string, any>> | null | undefined, R: number, options: CylinderOptions = {}): THREE.Group {
  const {
    opacity = 0.9,
    merge = false,
    transitionDuration = 0,
    tweenGroup = null
  } = options

  const items = Array.isArray(data) ? data : []
  if (!items.length) return new THREE.Group()

  const values = items.map(item => Number(resolveField(item, options.getValue || defaultGetValue, 0)) || 0)
  const computedMax = options.maxValue ?? Math.max(...values, 0.0001)
  const computedMin = Math.min(...values, 0)

  const resultGroup = new THREE.Group()
  resultGroup.name = 'CylinderScatterPoints'

  if (merge) {
    const geometries: THREE.CylinderGeometry[] = []
    items.forEach(item => {
      const state = getCylinderState(item, R, options, computedMax, computedMin)
      if (!state) return
      const geometry = new THREE.CylinderGeometry(state.finalRadius, state.finalRadius, state.height, state.segments, 1)
      geometry.translate(0, state.height / 2, 0)
      geometry.applyQuaternion(state.quaternion)
      geometry.translate(state.position.x, state.position.y, state.position.z)

      const count = geometry.attributes.position.count
      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        colors[i * 3] = state.itemColor.r
        colors[i * 3 + 1] = state.itemColor.g
        colors[i * 3 + 2] = state.itemColor.b
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometries.push(geometry)
    })

    // 属性集不一致时 mergeGeometries 可能返回 null（与原实现行为一致）
    const mergedGeometry = mergeGeometries(geometries) as THREE.BufferGeometry
    geometries.forEach(g => g.dispose())

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(mergedGeometry, material)
    mesh.name = 'CylinderScatterPointsMerged'
    mesh.userData = { itemCount: geometries.length }
    resultGroup.add(mesh)
  } else {
    items.forEach(item => {
      // createCylinderScatterPoints 自己管理整体的生长动画，避免单柱重复创建 Tween
      const mesh = createCylinderForItem(item, R, { ...options, maxValue: computedMax, tweenGroup: null })
      if (mesh) resultGroup.add(mesh)
    })
  }

  if (transitionDuration > 0) {
    const meshList = resultGroup.children.filter(c => (c as THREE.Mesh).isMesh)

    if (!merge && meshList.length) {
      meshList.forEach(mesh => { mesh.scale.y = 0 })
    } else if (merge && meshList.length) {
      resultGroup.scale.y = 0
    }

    if (tweenGroup) {
      const progress = { value: 0 }
      const tween = new TWEEN.Tween(progress, tweenGroup)
        .to({ value: 1 }, transitionDuration)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          if (merge) {
            resultGroup.scale.y = progress.value
          } else {
            meshList.forEach(mesh => { mesh.scale.y = progress.value })
          }
        })
        .start()
      resultGroup.userData.transitionTweens = [tween]
    } else if (typeof requestAnimationFrame === 'function') {
      const startTime = performance.now()
      const animate = (time: number): void => {
        const elapsed = time - startTime
        const t = Math.min(1, elapsed / transitionDuration)
        const ease = 1 - Math.pow(1 - t, 3)

        if (merge) {
          resultGroup.scale.y = ease
        } else {
          meshList.forEach(mesh => { mesh.scale.y = ease })
        }

        if (t < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }
  }

  return resultGroup
}
