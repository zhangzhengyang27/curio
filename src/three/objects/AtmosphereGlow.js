import { createGlowMesh } from './GlowMesh.js'

/**
 * 大气层散射光晕 — 基于 GlowMesh 的改进版
 * 保持原有 API 向后兼容，同时支持更丰富的辉光参数
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {string|THREE.Color} [options.color='#4488ff'] - 辉光颜色
 * @param {number} [options.altitude=0.15] - 大气厚度比例 (R * altitude)，旧版参数
 * @param {number} [options.size=0.15] - 外扩厚度比例 (R * size)，新版参数
 * @param {number} [options.coefficient=0.1] - 正面发光系数
 * @param {number} [options.power=3.5] - 边缘发光幂指数
 * @param {number} [options.opacity=0.35] - 不透明度
 * @param {number} [options.curvatureResolution=64] - 球体几何细分段数
 * @returns {THREE.Mesh}
 */
export function createAtmosphereGlow(R, options = {}) {
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
