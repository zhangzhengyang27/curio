import { BaseLayer } from './BaseLayer'
import { createCylinderScatterPoints } from '../objects/CylinderScatterPoints'
import { create3DLabels } from '../objects/Labels3D'

/**
 * 世界地标图层
 * 用彩色圆柱标记世界著名地标
 */
export class LandmarksLayer extends BaseLayer {
  _build(): void {
    const landmarks = [
      { name: '埃菲尔铁塔', lon: 2.29, lat: 48.86, color: 0xffcc00 },
      { name: '自由女神像', lon: -74.04, lat: 40.69, color: 0x44ff44 },
      { name: '大本钟', lon: -0.12, lat: 51.50, color: 0xff8844 },
      { name: '悉尼歌剧院', lon: 151.21, lat: -33.86, color: 0x4488ff },
      { name: '长城', lon: 116.57, lat: 40.43, color: 0xff4444 },
      { name: '金字塔', lon: 31.13, lat: 29.98, color: 0xffaa00 },
      { name: '泰姬陵', lon: 78.04, lat: 27.17, color: 0xffffff },
      { name: '东京塔', lon: 139.75, lat: 35.66, color: 0xff6688 }
    ]

    const scatter = createCylinderScatterPoints(landmarks, this.R, {
      getValue: () => 1,
      maxValue: 1,
      heightScale: 15,
      minHeight: 10,
      radius: 1.5,
      color: (value, normalized, item) => item.color,
      opacity: 0.9,
      segments: 8,
      merge: false,
      tweenGroup: this.tweenGroup
    })
    this._add(scatter)
    if (scatter.userData?.transitionTweens) {
      this._addDisposable({
        dispose: () => {
          scatter.userData.transitionTweens.forEach((t: { stop(): void }) => { try { t.stop() } catch (_e) { /* ignore */ } })
        }
      })
    }

    const baseOffset = this.R * 1.002 - this.R
    const height = 10 + 15 // minHeight + heightScale（所有地标归一化值为 1）
    const labelData = landmarks.map(item => ({
      lat: item.lat,
      lon: item.lon,
      text: item.name,
      altitude: baseOffset + height,
      fontSize: 18,
      scale: 0.12,
      backgroundColor: 'rgba(0,0,0,0.55)'
    }))
    const labels = create3DLabels(labelData, this.R, {
      offset: 2,
      autoHide: true
    })
    this._add(labels)
  }
}
