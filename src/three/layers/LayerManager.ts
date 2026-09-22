import type * as THREE from 'three'
import type { Group as TweenGroup } from '@tweenjs/tween.js'
import { BaseLayer } from './BaseLayer'
import type { BaseLayerParams } from './BaseLayer'

export type { BaseLayerParams } from './BaseLayer'

export type LayerManagerParams = BaseLayerParams

/**
 * 图层管理器
 * 按 category 管理活动图层，切换时自动销毁同类别旧图层
 */
export class LayerManager {
  parent?: THREE.Object3D | null
  scene?: THREE.Scene | null
  earthGroup?: THREE.Group | null
  R: number
  tweenGroup?: TweenGroup | null

  registry: Map<string, { LayerClass: typeof BaseLayer; category: string }>
  layers: Map<string, BaseLayer>
  categories: Map<string, Set<string>>

  constructor(params: LayerManagerParams) {
    const { parent, scene, earthGroup, R, tweenGroup } = params
    this.parent = parent
    this.scene = scene
    this.earthGroup = earthGroup
    this.R = R
    this.tweenGroup = tweenGroup

    this.registry = new Map()
    this.layers = new Map()
    this.categories = new Map()
  }

  /**
   * 注册图层类
   * @param category - 图层类别，switch 时同 category 的旧图层会被销毁
   */
  register(name: string, LayerClass: typeof BaseLayer, category = name): this {
    this.registry.set(name, { LayerClass, category })
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)!.add(name)
    return this
  }

  /**
   * 切换到指定图层
   * @param data
   * @param options
   */
  switch(name: string, data?: any, options: Record<string, any> = {}): BaseLayer | null {
    const reg = this.registry.get(name)
    if (!reg) {
      console.warn(`[LayerManager] layer "${name}" is not registered`)
      return null
    }

    const { LayerClass, category } = reg

    // 销毁同类别下其他活动图层
    const categoryLayers = this.categories.get(category)
    if (categoryLayers) {
      categoryLayers.forEach(n => {
        if (n !== name && this.layers.has(n)) {
          this.layers.get(n)!.destroy()
          this.layers.delete(n)
        }
      })
    }

    // 销毁同名旧图层
    if (this.layers.has(name)) {
      this.layers.get(name)!.destroy()
      this.layers.delete(name)
    }

    const layer = new LayerClass({
      scene: this.scene,
      earthGroup: this.earthGroup,
      R: this.R,
      tweenGroup: this.tweenGroup,
      parent: this.parent
    })

    // update 在图层尚未创建时会带着数据走 create，
    // 这里不再单独 create —— 否则 _build 会以空数据先跑一遍再被整个推翻
    layer.update(data, options)
    this.layers.set(name, layer)
    return layer
  }

  /**
   * 获取已创建的活动图层实例
   */
  get(name: string): BaseLayer | undefined {
    return this.layers.get(name)
  }

  /** 销毁所有活动图层 */
  destroyAll(): void {
    this.layers.forEach(layer => layer.destroy())
    this.layers.clear()
  }

  /** 销毁所有图层并清空注册表 */
  dispose(): void {
    this.destroyAll()
    this.registry.clear()
    this.categories.clear()
  }
}
