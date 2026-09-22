import type * as THREE from 'three'
import { BaseLayer } from './BaseLayer'
import { createMagnitudeScale } from '../utils/colorScale'
import { createCylinderForItem, updateCylinderForItem } from '../objects/CylinderScatterPoints'
import { create3DLabels } from '../objects/Labels3D'
import { applyUndergroundClipping } from '../utils/shaders'
import type { DataDigest } from '../utils/DataDigest'

/**
 * 地震分布图层
 * 根据震级绘制圆柱散点，高度与半径均映射震级
 */
export class EarthquakeLayer extends BaseLayer {
  private _labels: THREE.Group | null
  private _magnitudeScale: (value: number) => string
  private _scatterDigest: DataDigest<any, any>

  constructor(params: ConstructorParameters<typeof BaseLayer>[0]) {
    super(params)

    this._labels = null
    this._magnitudeScale = createMagnitudeScale()
    this._scatterDigest = this._createDigest({
      getId: item => item.id ?? `${item.lat},${item.lon}`,
      onCreate: item => {
        const cylinder = createCylinderForItem(item, this.R, this._getCylinderOptions(item))
        if (!cylinder) return null
        applyUndergroundClipping(cylinder, this.R)
        return cylinder
      },
      onUpdate: (obj, item) => updateCylinderForItem(obj, item, this.R, this._getCylinderOptions(item))
    })
  }

  /**
   * 差异更新数据：不重绘全部对象，仅创建/更新/删除变化的数据点
   * @param data
   * @param options
   */
  update(data: any, options: Record<string, any> = {}): this {
    this.data = data
    this.options = options
    if (!this.created) this.create()
    this._build()
    return this
  }

  _getCylinderOptions(_item?: Record<string, any>) {
    return {
      getValue: (item: Record<string, any>) => item.mag,
      maxValue: 9,
      heightScale: 25,
      minHeight: 0.5,
      radius: (item: Record<string, any>) => 0.3 + ((item.mag - 3) / 6) * 2.2,
      colorScale: this._magnitudeScale,
      opacity: 0.9,
      segments: 6,
      transitionDuration: 500,
      tweenGroup: this.tweenGroup
    }
  }

  _build(): void {
    const data = this.data
    if (!data) return

    this._digestData(data, this._scatterDigest)
    this._buildLabels(data)
  }

  _buildLabels(data: Array<Record<string, any>>): void {
    if (this._labels) {
      this._remove(this._labels)
      this._labels = null
    }

    const threshold = this.options.magThreshold ?? 6
    const baseOffset = this.R * 1.002 - this.R

    const labelData = data
      .filter(item => item.mag >= threshold)
      .map(item => {
        const normalized = item.mag / 9
        const height = 0.5 + normalized * 25
        return {
          lat: item.lat,
          lon: item.lon,
          text: item.name || item.title || `M${item.mag}`,
          altitude: baseOffset + height,
          fontSize: 16,
          scale: 0.1,
          color: '#ffddaa',
          backgroundColor: 'rgba(60,20,10,0.6)'
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
