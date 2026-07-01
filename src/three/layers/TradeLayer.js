import { BaseLayer } from './BaseLayer.js'
import { createSequentialScale } from '../utils/colorScale.js'
import { createArcLines, animateArcDashes } from '../objects/FlowLines.js'

/**
 * 全球贸易流图层
 * 绘制国家间的贸易流向弧线并附带虚线流动动画
 */
export class TradeLayer extends BaseLayer {
  _build() {
    const flows = this.data
    if (!flows || !flows.length) return

    const values = flows.map(f => f.value ?? 0)
    const minV = Math.min(...values, 0)
    const maxV = Math.max(...values, 0.0001)
    const colorScale = createSequentialScale('Cool', [minV, maxV])

    const arcs = createArcLines(flows, this.R, {
      mode: 'line',
      color: (item) => {
        const c = colorScale(item.value ?? 0)
        return [c, c]
      },
      opacity: 0.6,
      arcAltitudeAutoScale: 0.5,
      dashSize: 0.1,
      gapSize: 0.05,
      dashAnimateTime: 1800,
      dashOffset: 0.15,
      tweenGroup: this.tweenGroup
    })
    this._add(arcs)

    const arcAnim = animateArcDashes(arcs)
    this._addDisposable(arcAnim)
    this._addAnimation(time => arcAnim.update(time))
  }
}
