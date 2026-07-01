import { BaseLayer } from './BaseLayer.js'
import { createSequentialScale } from '../utils/colorScale.js'
import { createCylinderForItem, updateCylinderForItem } from '../objects/CylinderScatterPoints.js'
import { create3DLabels } from '../objects/Labels3D.js'
import { applyUndergroundClipping } from '../utils/shaders.js'

/**
 * 中国省级 GDP 图层
 * 根据各省 GDP 绘制圆柱热力散点并飞到中国视角
 */
export class ChinaLayer extends BaseLayer {
  constructor(params) {
    super(params)

    this._labels = null
    this._maxGdp = 1
    this._scatterR = this.R * 1.015
    this._scatterDigest = this._createDigest({
      getId: item => item.name ?? `${item.lat},${item.lon}`,
      onCreate: item => {
        const cylinder = createCylinderForItem(item, this._scatterR, this._getCylinderOptions())
        applyUndergroundClipping(cylinder, this.R)
        return cylinder
      },
      onUpdate: (obj, item) => updateCylinderForItem(obj, item, this._scatterR, this._getCylinderOptions())
    })
  }

  /**
   * 差异更新数据：不重绘全部对象，仅创建/更新/删除变化的数据点
   * @param {*} data
   * @param {object} options
   */
  update(data, options = {}) {
    this.data = data
    this.options = options
    if (!this.created) this.create()
    this._build()
    return this
  }

  _getCylinderOptions() {
    const colorScale = createSequentialScale('Reds', [0, this._maxGdp])
    return {
      getValue: item => item.value,
      maxValue: this._maxGdp,
      heightScale: 25,
      minHeight: 1,
      radius: 1,
      colorScale,
      opacity: 0.9,
      segments: 6,
      transitionDuration: 500,
      tweenGroup: this.tweenGroup
    }
  }

  _build() {
    const geojson = this.data
    if (!geojson?.features) return

    const scatterData = geojson.features.map(f => {
      const coords = f.geometry.coordinates[0]
      const sumLon = coords.reduce((s, c) => s + c[0], 0) / coords.length
      const sumLat = coords.reduce((s, c) => s + c[1], 0) / coords.length
      return {
        lon: sumLon,
        lat: sumLat,
        value: f.properties.gdp / 10000,
        name: f.properties.nameZh
      }
    })

    this._maxGdp = Math.max(...scatterData.map(d => d.value), 1)
    const scatterR = this.R * 1.015
    const baseOffset = scatterR * 1.002 - this.R

    this._digestData(scatterData, this._scatterDigest)
    this._buildLabels(scatterData, baseOffset)

    if (typeof this.options.flyTo === 'function') {
      this.options.flyTo(104, 35)
    }
  }

  _buildLabels(scatterData, baseOffset) {
    if (this._labels) {
      this._remove(this._labels)
      this._labels = null
    }

    const labelData = scatterData.map(d => {
      const normalized = this._maxGdp > 0 ? d.value / this._maxGdp : 0
      const height = 1 + normalized * 25
      return {
        lat: d.lat,
        lon: d.lon,
        text: d.name,
        altitude: baseOffset + height,
        fontSize: 16,
        scale: 0.1,
        backgroundColor: 'rgba(0,0,0,0.5)'
      }
    })

    if (labelData.length) {
      this._labels = create3DLabels(labelData, this.R, {
        offset: 2,
        autoHide: true
      })
      this._add(this._labels)
    }
  }
}
