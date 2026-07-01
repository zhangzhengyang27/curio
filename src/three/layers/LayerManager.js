import { BaseLayer as _BaseLayer } from './BaseLayer.js'

/**
 * 图层管理器
 * 按 category 管理活动图层，切换时自动销毁同类别旧图层
 */
export class LayerManager {
  /**
   * @param {object} params
   * @param {THREE.Object3D} [params.parent] - 图层默认挂载节点
   * @param {THREE.Scene} [params.scene]
   * @param {THREE.Group} [params.earthGroup]
   * @param {number} [params.R]
   * @param {TWEEN.Group} [params.tweenGroup]
   */
  constructor({ parent, scene, earthGroup, R, tweenGroup } = {}) {
    this.parent = parent
    this.scene = scene
    this.earthGroup = earthGroup
    this.R = R
    this.tweenGroup = tweenGroup

    /** @type {Map<string, {LayerClass: typeof BaseLayer, category: string}>} */
    this.registry = new Map()
    /** @type {Map<string, BaseLayer>} */
    this.layers = new Map()
    /** @type {Map<string, Set<string>>} */
    this.categories = new Map()
  }

  /**
   * 注册图层类
   * @param {string} name
   * @param {typeof BaseLayer} LayerClass
   * @param {string} [category=name] - 图层类别，switch 时同 category 的旧图层会被销毁
   */
  register(name, LayerClass, category = name) {
    this.registry.set(name, { LayerClass, category })
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category).add(name)
    return this
  }

  /**
   * 切换到指定图层
   * @param {string} name
   * @param {*} data
   * @param {object} [options]
   * @returns {BaseLayer|null}
   */
  switch(name, data, options = {}) {
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
          this.layers.get(n).destroy()
          this.layers.delete(n)
        }
      })
    }

    // 销毁同名旧图层
    if (this.layers.has(name)) {
      this.layers.get(name).destroy()
      this.layers.delete(name)
    }

    const layer = new LayerClass({
      scene: this.scene,
      earthGroup: this.earthGroup,
      R: this.R,
      tweenGroup: this.tweenGroup,
      parent: this.parent
    })

    layer.create()
    layer.update(data, options)
    this.layers.set(name, layer)
    return layer
  }

  /**
   * 获取已创建的活动图层实例
   * @param {string} name
   */
  get(name) {
    return this.layers.get(name)
  }

  /** 销毁所有活动图层 */
  destroyAll() {
    this.layers.forEach(layer => layer.destroy())
    this.layers.clear()
  }

  /** 销毁所有图层并清空注册表 */
  dispose() {
    this.destroyAll()
    this.registry.clear()
    this.categories.clear()
  }
}
