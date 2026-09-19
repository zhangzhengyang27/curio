import type { Color } from 'three'
import { createGlowMesh } from './GlowMesh'

/**
 * 大气层散射光晕 — 基于 GlowMesh 的改进版
 * 保持原有 API 向后兼容，同时支持更丰富的辉光参数
 * @param R - 地球半径
 */
export function createAtmosphereGlow(
  R: number,
  options: {
    /** 辉光颜色 */
    color?: string | Color
    /** 大气厚度比例 (R * altitude)，旧版参数 */
    altitude?: number
    /** 外扩厚度比例 (R * size)，新版参数 */
    size?: number
    /** 正面发光系数 */
    coefficient?: number
    /** 边缘发光幂指数 */
    power?: number
    /** 不透明度 */
    opacity?: number
    /** 球体几何细分段数 */
    curvatureResolution?: number
  } = {}
): ReturnType<typeof createGlowMesh> {
  const {
    color = '#4488ff',
    altitude = 0.15,
    size = altitude,
    coefficient = 0.1,
    power = 3.5,
    opacity = 0.35,
    curvatureResolution = 64
  } = options

  return createGlowMesh(R, {
    color,
    coefficient,
    power,
    hollowRadius: R,
    opacity,
    size,
    curvatureResolution
  })
}
