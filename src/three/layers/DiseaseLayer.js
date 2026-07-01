import { BaseLayer } from './BaseLayer.js'
import { createRepeatableRings } from '../objects/WaveRipple.js'

/**
 * 疫情传播图层
 * 在数据源点绘制可复用的扩散脉冲环动画
 */
export class DiseaseLayer extends BaseLayer {
  _build() {
    let diseases = this.data
    if (!diseases) return

    // 防御：处理非数组数据（如对象包装、Promise 等）
    if (!Array.isArray(diseases)) {
      console.warn('[DiseaseLayer] data is not an array, trying to unwrap:', diseases)
      if (diseases.data && Array.isArray(diseases.data)) {
        diseases = diseases.data
      } else if (diseases.features && Array.isArray(diseases.features)) {
        diseases = diseases.features
      } else {
        console.error('[DiseaseLayer] cannot process data:', diseases)
        return
      }
    }

    diseases.forEach(d => {
      const color = parseInt(d.color.replace('#', '0x'), 16)
      const { group, controller } = createRepeatableRings(d.origin, this.R, {
        ringColor: color,
        ringMaxRadius: 25,
        ringPropagationSpeed: d.speed * 1.5,
        ringRepeatPeriod: 2000 / d.speed,
        ringResolution: 64,
        ringAltitude: 0.02,
        tweenGroup: this.tweenGroup
      })

      this._add(group)
      this._addDisposable(controller)
      this._addAnimation(time => controller.update(time))
    })
  }
}
