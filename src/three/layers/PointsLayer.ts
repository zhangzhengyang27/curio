import { BaseLayer } from './BaseLayer'
import { createCylinderScatterPoints } from '../objects/CylinderScatterPoints'

/**
 * 通用圆柱散点图层
 * 通过 options 直接透传给 createCylinderScatterPoints
 */
export class PointsLayer extends BaseLayer {
  _build(): void {
    const points = this.data
    if (!points?.length) return

    const scatter = createCylinderScatterPoints(points, this.R, { tweenGroup: this.tweenGroup, ...this.options })
    this._add(scatter)
    if (scatter.userData?.transitionTweens) {
      this._addDisposable({
        dispose: () => {
          scatter.userData.transitionTweens.forEach((t: { stop(): void }) => { try { t.stop() } catch (_e) { /* ignore */ } })
        }
      })
    }
  }
}
