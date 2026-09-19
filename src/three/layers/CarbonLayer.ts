import * as THREE from 'three'
import { BaseLayer } from './BaseLayer'
import type { CountryGdpMesh, EarthGroupWithMeshes } from './BaseLayer'
import { createSequentialScale } from '../utils/colorScale'
import { createCylinderScatterPoints } from '../objects/CylinderScatterPoints'
import { applyUndergroundClipping } from '../utils/shaders'

/**
 * 碳排放图层
 * 根据各国碳排放数据为国家 Mesh 着色，并在排放国上方绘制高度圆柱
 */
export class CarbonLayer extends BaseLayer {
  _build(): void {
    const data = this.data as Record<string, { emission: number }> | null
    if (!data) return

    const emissions = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v.emission])
    )
    const emissionValues = Object.values(emissions)
    const maxE = Math.max(...emissionValues, 0.0001)
    const colorScale = createSequentialScale('Oranges', [0, maxE])

    const meshes = (this.earthGroup as EarthGroupWithMeshes | null | undefined)?.meshArr
    meshes?.forEach((mesh: CountryGdpMesh) => {
      const emission = emissions[mesh.name]
      if (emission != null) {
        const c = new THREE.Color(colorScale(emission))
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
        return i ? { lon: i.lon, lat: i.lat, value: d.emission } : null
      })
      .filter((d): d is { lon: number; lat: number; value: number } => d !== null)

    if (scatterData.length) {
      const scatter = createCylinderScatterPoints(scatterData, this.R, {
        getValue: item => item.value,
        maxValue: maxE,
        heightScale: 60,
        minHeight: 2,
        radius: 1.2,
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
            scatter.userData.transitionTweens.forEach((t: { stop(): void }) => { try { t.stop() } catch (_e) { /* ignore */ } })
          }
        })
      }
    }
  }
}
