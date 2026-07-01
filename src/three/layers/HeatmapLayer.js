import * as THREE from 'three'
import { BaseLayer } from './BaseLayer.js'
import { computeGeoKde } from '../data/HeatmapKDE.js'
import {
  applyShaderExtensionToMaterial,
  setRadiusShaderExtend
} from '../utils/shaders.js'
import { createSequentialScale } from '../utils/colorScale.js'

/**
 * KDE 热力图图层
 * 在球面上计算核密度估计，通过顶点颜色和半径变形呈现热力分布
 *
 * 数据格式：{ points: [{ lat, lon, weight? }], options?: { bandwidth?, resolution? } }
 */
export class HeatmapLayer extends BaseLayer {
  /**
   * @param {object} params
   * @param {number} params.R - 地球半径
   * @param {THREE.Group} [params.earthGroup]
   * @param {THREE.Scene} [params.scene]
   * @param {TWEEN.Group} [params.tweenGroup]
   */
  constructor(params) {
    super(params)

    /** @type {THREE.Mesh|null} 热力球壳 */
    this._heatShell = null
    /** @type {THREE.Mesh|null} 过渡目标壳（Tween 动画用） */
    this._targetShell = null
  }

  _build() {
    const data = this.data
    if (!data || !data.points || !data.points.length) return

    const points = data.points
    const bandwidth = data.bandwidth ?? 2
    const altitude = data.altitude ?? 0.01 // 球壳偏移量（防止 z-fighting）
    const opacity = data.opacity ?? 0.6
    const resolution = data.resolution ?? 72 // 球体网格分辨率
    const colorSaturation = data.colorSaturation ?? 1.0

    // 1. 生成球面采样点（从球体几何体顶点提取 lat/lon）
    const geo = new THREE.SphereGeometry(this.R, resolution, resolution / 2)
    const positions = geo.attributes.position
    const vertexCount = positions.count

    const targetCoords = []
    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      // Cartesian → Polar（与 shader 中的转换保持一致）
      const r = Math.sqrt(x * x + y * y + z * z)
      const phi = Math.acos(y / r)
      const theta = Math.atan2(z, x)

      const lat = 90 - (phi * 180) / Math.PI
      let lon = 90 - (theta * 180) / Math.PI
      if (theta < -Math.PI / 2) lon -= 360

      targetCoords.push({ lat, lon })
    }

    // 2. 计算 KDE
    const densities = computeGeoKde(points, targetCoords, bandwidth)

    // 3. 归一化密度（0-1）
    const maxD = Math.max(...densities, 0.0001)

    // 4. 生成顶点颜色
    const colorScale = createSequentialScale('Turbo', [0, maxD])
    const vertexColors = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
      const normalized = densities[i] / maxD
      const adjusted = Math.pow(normalized, 0.5) * colorSaturation // 平方根提亮低值区域
      const c = colorScale(adjusted * maxD)
      const color = new THREE.Color(c)
      vertexColors[i * 3] = color.r
      vertexColors[i * 3 + 1] = color.g
      vertexColors[i * 3 + 2] = color.b
    }

    // 5. 生成半径变形属性
    const rArray = new Float32Array(vertexCount)
    for (let i = 0; i < vertexCount; i++) {
      const normalized = densities[i] / maxD
      // 热力密集区域向外扩张 1%~2%
      rArray[i] = this.R * (1 + altitude + normalized * altitude * 2)
    }

    // 6. 构建球壳 Mesh
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', positions.clone())
    geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3))
    geometry.setAttribute('r', new THREE.BufferAttribute(rArray, 1))
    geometry.setIndex(geo.index ? geo.index.clone() : null)
    geo.dispose() // 释放临时几何体

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
      side: THREE.FrontSide,
      depthTest: true,
      depthWrite: false
    })

    // 7. 应用半径变形着色器
    applyShaderExtensionToMaterial(material, setRadiusShaderExtend)

    this._heatShell = new THREE.Mesh(geometry, material)
    this._add(this._heatShell)
  }

  /**
   * 更新热力图数据
   */
  update(data, options = {}) {
    this.data = data
    this.options = options
    if (!this.created) this.create()
    // 全量重建（KDE 结果完全变化）
    this._clear()
    this._build()
    return this
  }
}
