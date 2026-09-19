import * as THREE from 'three'
import { geoGraticule10 } from 'd3'
import GeoJsonGeometry from 'three-geojson-geometry'

/**
 * 创建经纬网格（Graticules）
 * @param R - 地球半径
 */
export function createGraticules(
  R: number,
  options: {
    /** 网格颜色 */
    color?: string | number | THREE.Color
    /** 不透明度 */
    opacity?: number
    /** 经纬线球面插值分辨率（度） */
    resolution?: number
    /** 网格相对地球半径的高度系数（避免深度冲突） */
    altitude?: number
  } = {}
): THREE.LineSegments {
  const {
    color = 0x888888,
    opacity = 0.25,
    resolution = 5,
    altitude = 1.005
  } = options

  const graticuleGeoJson = geoGraticule10()
  const geometry = new GeoJsonGeometry(graticuleGeoJson, R * altitude, resolution)

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false
  })

  const lines = new THREE.LineSegments(geometry, material)
  lines.name = 'graticules'
  lines.renderOrder = 10

  return lines
}
