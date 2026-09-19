import { BaseLayer } from './BaseLayer'
import { createSequentialScale } from '../utils/colorScale'
import { createCylinderScatterPoints } from '../objects/CylinderScatterPoints'
import { applyUndergroundClipping } from '../utils/shaders'

/**
 * 夜间灯光图层
 * 根据亮度绘制细小的圆柱散点
 */
export class NightLightsLayer extends BaseLayer {
  _build(): void {
    const data = this.data
    if (!data) return

    const colorScale = createSequentialScale('Turbo', [0, 1])
    const scatter = createCylinderScatterPoints(data, this.R * 1.005, {
      getValue: item => item.brightness,
      maxValue: 1,
      heightScale: 2,
      minHeight: 0.2,
      radius: 0.25,
      colorScale,
      opacity: 0.9,
      segments: 5,
      merge: true,
      tweenGroup: this.tweenGroup
    })
    this._add(scatter)
    applyUndergroundClipping(scatter, this.R)
    if (scatter.userData?.transitionTweens) {
      this._addDisposable({
        dispose: () => {
          scatter.userData.transitionTweens.forEach((t: { stop(): void }) => { try { t.stop() } catch (_e) { /* ignore */ } })
        }
      })
    }
  }
}
