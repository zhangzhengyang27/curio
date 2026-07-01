import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import { disposeObject3D } from '../gc.js'
import { DataDigest } from '../utils/DataDigest.js'

/**
 * 可视化图层基类
 * 封装 Three.js Group 的创建、销毁、数据更新与显隐控制
 */
export class BaseLayer {
  /**
   * @param {object} params
   * @param {THREE.Scene} params.scene
   * @param {THREE.Group} params.earthGroup
   * @param {number} params.R - 地球半径
   * @param {TWEEN.Group} [params.tweenGroup] - 可选的 TWEEN 分组
   * @param {THREE.Object3D} [params.parent] - 图层挂载节点，默认 earthGroup || scene
   */
  constructor({ scene, earthGroup, R, tweenGroup, parent } = {}) {
    this.scene = scene
    this.earthGroup = earthGroup
    this.R = R
    this.tweenGroup = tweenGroup
    this.parent = parent || earthGroup || scene

    this.group = new THREE.Group()
    this.group.userData.layer = this
    this.group.name = this.constructor.name

    this.objects = []
    this.disposables = []
    this.tweens = []
    this.animations = []
    this.digests = []
    this.visible = true
    this.created = false
    this.data = null
    this.options = {}
  }

  /**
   * 更新图层动画
   * @param {number} time
   */
  updateAnimation(time) {
    this.animations.forEach(fn => {
      try { fn(time) } catch (_e) { /* ignore */ }
    })
  }

  /**
   * 注册每帧动画回调
   * @param {function} fn
   */
  _addAnimation(fn) {
    if (typeof fn === 'function') {
      this.animations.push(fn)
    }
    return fn
  }

  /**
   * 创建图层：将 group 加入父节点，并调用子类 _build
   */
  create() {
    if (this.created) return this
    this.created = true

    if (this.parent && this.group.parent !== this.parent) {
      this.parent.add(this.group)
    }

    this._build()
    this.group.visible = this.visible
    return this
  }

  /**
   * 更新图层数据
   * @param {*} data
   * @param {object} options
   */
  update(data, options = {}) {
    this.data = data
    this.options = options
    if (!this.created) this.create()
    this._clear()
    this._build()
    return this
  }

  /**
   * 销毁图层：停止动画、释放资源、移除 group
   */
  destroy() {
    this._stopTweens()
    this._clear()
    if (this.group.parent) {
      this.group.parent.remove(this.group)
    }
    disposeObject3D(this.group)
    this.objects = []
    this.disposables = []
    this.tweens = []
    this.created = false
    return this
  }

  /** 显示图层 */
  show() {
    this.visible = true
    if (this.group) this.group.visible = true
    return this
  }

  /** 隐藏图层 */
  hide() {
    this.visible = false
    if (this.group) this.group.visible = false
    return this
  }

  /**
   * 向图层添加一个 Three.js 对象，并追踪以便释放
   * @param {THREE.Object3D} obj
   */
  _add(obj) {
    if (!obj) return obj
    this.group.add(obj)
    this.objects.push(obj)
    return obj
  }

  /**
   * 从图层移除并释放一个已追踪的 Three.js 对象
   * @param {THREE.Object3D} obj
   */
  _remove(obj) {
    if (!obj) return obj
    if (obj.userData?.transitionTweens) {
      obj.userData.transitionTweens.forEach(t => { try { t.stop() } catch (_e) { /* ignore */ } })
    }
    if (obj.parent === this.group) this.group.remove(obj)
    disposeObject3D(obj)
    const idx = this.objects.indexOf(obj)
    if (idx >= 0) this.objects.splice(idx, 1)
    return obj
  }

  /**
   * 创建一个 DataDigest 实例，用于差异更新图层对象
   * @param {object} options
   */
  _createDigest(options) {
    const digest = new DataDigest(options)
    this.digests.push(digest)
    return digest
  }

  /**
   * 使用 DataDigest 对比数据差异，并自动将新增/移除的对象加入/移出图层
   * @param {Array} data
   * @param {DataDigest} digest
   */
  _digestData(data, digest) {
    const { created, updated, removed } = digest.update(data)
    created.forEach(({ obj }) => {
      if (obj) this._add(obj)
    })
    removed.forEach(({ obj }) => {
      this._remove(obj)
    })
    return { created, updated, removed }
  }

  /**
   * 添加一个自定义可释放对象（如动画控制器）
   * @param {{dispose:function}} obj
   */
  _addDisposable(obj) {
    if (obj && typeof obj.dispose === 'function') {
      this.disposables.push(obj)
    }
    return obj
  }

  /**
   * 创建 Tween，自动使用传入的 tweenGroup 或全局 TWEEN
   * @param {object} target
   */
  _createTween(target) {
    const tween = this.tweenGroup
      ? new TWEEN.Tween(target, this.tweenGroup)
      : new TWEEN.Tween(target)
    this.tweens.push(tween)
    return tween
  }

  /** 清空图层内已追踪的对象与自定义可释放对象 */
  _clear() {
    this.disposables.forEach(d => {
      try { d.dispose() } catch (_e) { /* ignore */ }
    })
    this.disposables = []
    this.animations = []
    this.digests.forEach(d => { try { d.clear() } catch (_e) { /* ignore */ } })
    this.digests = []

    this.objects.forEach(obj => this._remove(obj))
    this.objects = []

    // 清理未被追踪的遗留子节点
    while (this.group.children.length > 0) {
      const child = this.group.children[0]
      this.group.remove(child)
      disposeObject3D(child)
    }
  }

  /** 停止所有由该图层创建的 Tween */
  _stopTweens() {
    this.tweens.forEach(tween => {
      try { tween.stop() } catch (_e) { /* ignore */ }
    })
    this.tweens = []
  }

  /**
   * 子类实现：构建图层内容
   * 使用 this._add(...) / this._addDisposable(...) / this._createTween(...)
   */
  _build() {
    // subclass override
  }
}
