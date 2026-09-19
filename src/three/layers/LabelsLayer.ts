import type * as THREE from 'three'
import { BaseLayer } from './BaseLayer'
import { create3DLabels } from '../objects/Labels3D'

/**
 * 通用 3D 文字标签图层
 * 基于 BaseLayer 生命周期管理，支持相机背侧自动隐藏
 */
export class LabelsLayer extends BaseLayer {
  private labelGroup: THREE.Group | null = null

  _build(): void {
    const data = this.data
    if (!Array.isArray(data) || !data.length) return

    const opts = {
      fontSize: 18,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: 6,
      borderRadius: 4,
      scale: 0.12,
      offset: 2,
      autoHide: true,
      ...this.options
    }

    this.labelGroup = create3DLabels(data, this.R, opts)
    this._add(this.labelGroup)
  }

  updateAnimation(time: number): void {
    super.updateAnimation(time)
    if (this.labelGroup?.userData?.updateVisibility) {
      const camera = this.options?.camera
      if (camera) {
        this.labelGroup.userData.updateVisibility(camera)
      }
    }
  }
}
