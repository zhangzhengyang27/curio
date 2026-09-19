import * as THREE from 'three'
import {
  scaleLinear,
  scaleSequential,
  scaleThreshold,
  interpolateTurbo,
  interpolateViridis,
  interpolatePlasma,
  interpolateInferno,
  interpolateWarm,
  interpolateCool,
  interpolateYlOrRd,
  interpolateOranges,
  interpolateReds,
  interpolateMagma
} from 'd3'

/**
 * d3-scale 与 d3-scale-chromatic 统一颜色映射工具
 *
 * 所有 scale 返回的结果均会被归一化为 hex 字符串或 THREE.Color，
 * 以便与现有 Three.js 材质代码直接兼容。
 */

type D3Interpolator = (t: number) => string
type ColorInput = string | number | THREE.Color

/** 命名插值器预设 */
export const TURBO = 'turbo'
export const VIRIDIS = 'viridis'
export const PLASMA = 'plasma'
export const INFERNO = 'inferno'
export const WARM = 'warm'
export const COOL = 'cool'

const interpolatorMap: Record<string, D3Interpolator> = {
  [TURBO]: interpolateTurbo,
  [VIRIDIS]: interpolateViridis,
  [PLASMA]: interpolatePlasma,
  [INFERNO]: interpolateInferno,
  [WARM]: interpolateWarm,
  [COOL]: interpolateCool,
  ylorrd: interpolateYlOrRd,
  oranges: interpolateOranges,
  reds: interpolateReds,
  magma: interpolateMagma
}

function resolveInterpolator(interpolator: string | D3Interpolator): D3Interpolator {
  if (typeof interpolator === 'function') return interpolator
  const key = typeof interpolator === 'string' ? interpolator.toLowerCase() : ''
  return interpolatorMap[key] || interpolateTurbo
}

/**
 * 将任意颜色值转为 CSS hex 字符串（含 # 前缀）
 * @param value - rgb 字符串 / hex 字符串 / 数字 / THREE.Color
 */
export function toHexString(value: ColorInput | null | undefined): string | null {
  if (value == null) return null
  if (value instanceof THREE.Color) return '#' + value.getHexString()
  try {
    const c = new THREE.Color(value)
    return '#' + c.getHexString()
  } catch {
    return null
  }
}

/**
 * 创建线性颜色比例尺
 * @param domain - [min, max]
 * @param range - 颜色数组
 */
export function createLinearScale(domain: number[], range: ColorInput[]): (value: number) => string {
  const scale = scaleLinear<string, string>()
    .domain(domain)
    .range(range as string[])
  return value => toHexString(scale(value)) ?? 'ffffff'
}

/**
 * 创建顺序颜色比例尺（使用 d3-scale-chromatic 插值器）
 * @param interpolator - 预设名（如 'turbo'）或 d3 插值函数
 * @param domain - [min, max]
 */
export function createSequentialScale(interpolator: string | D3Interpolator, domain: number[]): (value: number) => string {
  const interp = resolveInterpolator(interpolator)
  const scale = scaleSequential(interp).domain(domain)
  return value => toHexString(scale(value)) ?? 'ffffff'
}

/**
 * 创建阈值颜色比例尺
 * @param thresholds - 阈值边界数组
 * @param colors - 阈值区间颜色（比 thresholds 多一个）
 */
export function createThresholdScale(thresholds: number[], colors: ColorInput[]): (value: number) => string {
  const scale = scaleThreshold<number, string>()
    .domain(thresholds)
    .range(colors as string[])
  return value => toHexString(scale(value)) ?? 'ffffff'
}

/**
 * 对任意颜色比例尺取值并返回 hex 字符串
 */
export function colorScaleToArray(scale: unknown, value: number): string {
  if (typeof scale !== 'function') return 'ffffff'
  return toHexString((scale as (v: number) => ColorInput)(value)) ?? 'ffffff'
}

/**
 * 快捷：创建人口密度常用顺序色阶（YlOrRd / Turbo）
 */
export function createPopulationScale(domain: number[]): (value: number) => string {
  return createSequentialScale('YlOrRd', domain)
}

/**
 * 快捷：创建碳排放常用顺序色阶（Oranges / Reds）
 */
export function createCarbonScale(domain: number[]): (value: number) => string {
  return createSequentialScale('Reds', domain)
}

/**
 * 快捷：创建 GDP / 夜间灯光等热力色阶（Turbo）
 */
export function createHeatScale(domain: number[]): (value: number) => string {
  return createSequentialScale(TURBO, domain)
}

/**
 * 快捷：创建地震震级阈值色阶
 * @param thresholds - 默认 [4, 5, 6, 7]
 * @param colors - 默认 ['#44ff44', '#ffff44', '#ffaa00', '#ff0000', '#aa0000']
 */
export function createMagnitudeScale(
  thresholds: number[] = [4, 5, 6, 7],
  colors: string[] = ['#44ff44', '#ffff44', '#ffaa00', '#ff0000', '#aa0000']
): (value: number) => string {
  return createThresholdScale(thresholds, colors)
}

// ────────────────────────────────────────────────────────────
// 颜色工具集（移植自 three-globe color-utils.js）
// ────────────────────────────────────────────────────────────

/**
 * 将任意颜色字符串转为整数 hex 值（用于 THREE.Color 构造函数或 shader uniform）
 * 支持: '#fff', '#ff0000', 'rgb(255,0,0)', 'red', 数字
 * @returns 整数 hex (如 0xff0000)
 */
export function colorStr2Hex(str: string | number): number {
  if (typeof str === 'number') return str
  try {
    const c = new THREE.Color(str)
    return c.getHex()
  } catch {
    return 0xffffff
  }
}

/**
 * 从颜色字符串中提取 alpha 值
 * 支持 rgba() 格式，其他格式默认返回 1
 * @returns 0-1
 */
export function colorAlpha(str: string | number | undefined | null): number {
  if (!str || typeof str === 'number') return 1
  const rgbaMatch = /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.eE+-]+)\s*\)/.exec(str.trim().toLowerCase())
  return rgbaMatch ? Math.min(+rgbaMatch[1], 1) : 1
}

/**
 * 将颜色字符串转换为 shader 友好的 [r, g, b, a] 数组
 * 自动检测 rgba() 格式并分离 alpha
 * @param str 颜色字符串
 * @param includeAlpha 是否包含 alpha 通道
 * @param sRGBColorSpace 是否转换为 sRGB 色彩空间
 * @returns [r, g, b] 或 [r, g, b, a]
 */
export function color2ShaderArr(str: string, includeAlpha = true, sRGBColorSpace = false): number[] {
  let color: THREE.Color
  let alpha = 1
  const rgbaMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.eE+-]+)\s*\)$/.exec(str.trim().toLowerCase())
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch
    color = new THREE.Color(`rgb(${+r},${+g},${+b})`)
    alpha = Math.min(+a, 1)
  } else {
    color = new THREE.Color(str)
  }

  if (sRGBColorSpace) {
    color.convertLinearToSRGB()
  }

  const rgbArr = color.toArray()
  return includeAlpha ? [...rgbArr, alpha] : rgbArr
}

/**
 * 安全设置材质透明度，自动管理 depthWrite
 * 透明材质 (opacity < 1) 应该设置 depthWrite=false 以避免 z-fighting
 * @param opacity 0-1
 * @param depthWrite 默认根据 opacity 自动决定
 */
export function setMaterialOpacity(
  material: THREE.Material | null | undefined,
  opacity: number,
  depthWrite?: boolean
): THREE.Material | null | undefined {
  if (!material) return material
  material.opacity = opacity
  material.transparent = opacity < 1
  material.depthWrite = depthWrite !== undefined ? depthWrite : opacity >= 1
  return material
}
