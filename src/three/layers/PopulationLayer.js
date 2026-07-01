import * as THREE from 'three'
import { BaseLayer } from './BaseLayer.js'
import { createSequentialScale } from '../utils/colorScale.js'
import { createCylinderScatterPoints } from '../objects/CylinderScatterPoints.js'
import { applyUndergroundClipping } from '../utils/shaders.js'

/**
 * 人口密度图层
 * 根据各国人口密度数据为国家 Mesh 着色，并在国家中心绘制高度圆柱
 */
export class PopulationLayer extends BaseLayer {
  _build() {
    const data = this.data
    if (!data) return

    const densities = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v.density])
    )
    const densityValues = Object.values(densities)
    const maxD = Math.max(...densityValues, 0.0001)
    const colorScale = createSequentialScale('YlOrRd', [0, maxD])

    this.earthGroup?.meshArr?.forEach(mesh => {
      const density = densities[mesh.name]
      if (density != null) {
        const c = new THREE.Color(colorScale(density))
        mesh.material.color.copy(c)
        mesh.color = c.clone()
      } else {
        mesh.material.color.set(0xcccccc)
        mesh.color = new THREE.Color(0xcccccc)
      }
    })

    const searchIndex = this.earthGroup?.userData?.searchIndex || {}
    const scatterData = Object.entries(data)
      .map(([name, d]) => {
        const i = searchIndex[name]
        return i ? { lon: i.lon, lat: i.lat, value: d.density } : null
      })
      .filter(Boolean)

    if (scatterData.length) {
      const scatter = createCylinderScatterPoints(scatterData, this.R, {
        getValue: item => item.value,
        maxValue: maxD,
        heightScale: 30,
        minHeight: 1,
        radius: 0.8,
        colorScale,
        opacity: 0.85,
        segments: 6,
        merge: true,
        tweenGroup: this.tweenGroup
      })
      this._add(scatter)
      applyUndergroundClipping(scatter, this.R)
      if (scatter.userData?.transitionTweens) {
        this._addDisposable({
          dispose: () => {
            scatter.userData.transitionTweens.forEach(t => { try { t.stop() } catch (_e) { /* ignore */ } })
          }
        })
      }
    }
  }
}
