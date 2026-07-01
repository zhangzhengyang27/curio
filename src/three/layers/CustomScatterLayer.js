import { BaseLayer } from './BaseLayer.js'
import { createCylinderForItem, updateCylinderForItem } from '../objects/CylinderScatterPoints.js'

/**
 * 自定义数据散点图层
 * 用于导入 CSV/JSON 数据后展示
 */
export class CustomScatterLayer extends BaseLayer {
  constructor(params) {
    super(params)

    this._scatterDigest = this._createDigest({
      getId: item => item.id ?? `${item.lat},${item.lon}`,
      onCreate: item => createCylinderForItem(item, this.R * 1.01, this._getCylinderOptions(item)),
      onUpdate: (obj, item) => updateCylinderForItem(obj, item, this.R * 1.01, this._getCylinderOptions(item))
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

  _getCylinderOptions(_item) {
    return {
      getValue: item => item.value ?? 1,
      heightScale: 10,
      minHeight: 1,
      radius: 0.8,
      color: 0x00cccc,
      opacity: 0.9,
      segments: 6,
      transitionDuration: 500,
      tweenGroup: this.tweenGroup,
      ...this.options.scatterOptions
    }
  }

  _build() {
    const points = this.data
    if (!points?.length) return

    this._digestData(points, this._scatterDigest)
  }
}
