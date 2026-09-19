import { BaseLayer } from './BaseLayer'
import { createSequentialScale } from '../utils/colorScale'
import { createArcLines, animateArcDashes } from '../objects/FlowLines'

/**
 * 航班流线图层
 * 绘制航班路线弧线并附带虚线流动动画
 */
export class FlightsLayer extends BaseLayer {
  _build(): void {
    const flights = this.data
    if (!flights || !flights.length) return

    const values = flights.map((f: { value?: number }) => f.value ?? 0)
    const minV = Math.min(...values, 0)
    const maxV = Math.max(...values, 0.0001)
    const colorScale = createSequentialScale('Warm', [minV, maxV])

    const arcs = createArcLines(flights, this.R, {
      mode: 'line',
      color: (item) => {
        const c = colorScale(item.value ?? 0)
        return [c, c] as [string, string]
      },
      opacity: 0.7,
      arcAltitudeAutoScale: 0.5,
      dashSize: 0.08,
      gapSize: 0.04,
      dashAnimateTime: 1500,
      dashOffset: 0.12,
      tweenGroup: this.tweenGroup
    })
    this._add(arcs)

    const arcAnim = animateArcDashes(arcs)
    this._addDisposable(arcAnim)
    this._addAnimation(time => arcAnim.update(time))
  }
}
