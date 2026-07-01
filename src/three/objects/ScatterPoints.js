import * as THREE from 'three'
import { lon2xyz } from '../geo/coord.js'

/**
 * @deprecated 已弃用，请使用 CylinderScatterPoints.js 替代。
 * 保留此文件仅用于向后兼容。
 *
 * 散点图层 — 支持颜色/大小映射
 * @param {Array} points - [{ lon, lat, value, ... }]
 * @param {number} R - 地球半径
 * @param {object} options
 * @returns {THREE.Points}
 */
export function createScatterPoints(points, R, options = {}) {
  const {
    color = 0xff4444,
    size = 0.8,
    sizeBy = null,        // 按哪个字段映射大小
    sizeRange = [0.3, 2],
    colorBy = null,       // 按哪个字段映射颜色
    colorRange = [0xffffff, 0xff0000],
    valueRange = null     // [min, max] for mapping
  } = options

  const positions = []
  const colors = []
  const sizes = []

  // 计算值域
  let vMin = valueRange ? valueRange[0] : Infinity
  let vMax = valueRange ? valueRange[1] : -Infinity
  if (!valueRange && (sizeBy || colorBy)) {
    points.forEach(p => {
      const v = p[sizeBy || colorBy]
      if (v < vMin) vMin = v
      if (v > vMax) vMax = v
    })
  }

  const c1 = new THREE.Color(colorRange[0])
  const c2 = new THREE.Color(colorRange[1])

  points.forEach(p => {
    const pos = lon2xyz(R, p.lon, p.lat)
    positions.push(pos.x, pos.y, pos.z)

    if (colorBy) {
      const t = (vMax > vMin) ? (p[colorBy] - vMin) / (vMax - vMin) : 0.5
      const c = c1.clone().lerp(c2, t)
      colors.push(c.r, c.g, c.b)
    } else {
      const c = new THREE.Color(color)
      colors.push(c.r, c.g, c.b)
    }

    if (sizeBy) {
      const t = (vMax > vMin) ? (p[sizeBy] - vMin) / (vMax - vMin) : 1
      sizes.push(sizeRange[0] + t * (sizeRange[1] - sizeRange[0]))
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (colorBy) {
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: !!colorBy,
    color: colorBy ? undefined : color,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  })

  return new THREE.Points(geometry, material)
}
