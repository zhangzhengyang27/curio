import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import type { Group as TweenGroup } from '@tweenjs/tween.js'
import { disposeObject3D } from '../gc'
import { DataDigest } from '../utils/DataDigest'
import type { DataDigestOptions } from '../utils/DataDigest'

/** BaseLayer / LayerManager 的公共构造参数 */
export interface BaseLayerParams {
  scene?: THREE.Scene | null
  earthGroup?: THREE.Group | null
  /** 地球半径 */
  R: number
  /** 可选的 TWEEN 分组 */
  tweenGroup?: TweenGroup | null
  /** 图层挂载节点，默认 earthGroup || scene */
  parent?: THREE.Object3D | null
}

/** DataLoader 在国家 Mesh 上挂载的自定义字段（color/gdp），材质为 MeshPhongMaterial */
export interface CountryGdpMesh extends THREE.Mesh {
  color?: THREE.Color
  gdp?: number
  material: THREE.MeshPhongMaterial & { color: THREE.Color; emissive: THREE.Color }
}

/** 持有 meshArr 的地球 Group（由 DataLoader.buildEarthFromData 构造） */
export interface EarthGroupWithMeshes extends THREE.Group {
  meshArr?: CountryGdpMesh[]
}

/**
 * 可视化图层基类
 * 封装 Three.js Group 的创建、销毁、数据更新与显隐控制
 */
export class BaseLayer {
  scene?: THREE.Scene | null
  earthGroup?: THREE.Group | null
  R: number
  tweenGroup?: TweenGroup | null
  parent: THREE.Object3D | null

  group: THREE.Group
  objects: THREE.Object3D[]
  disposables: Array<{ dispose(): void }>
  tweens: Array<TWEEN.Tween<any>>
  animations: Array<(time: number) => void>
  digests: Array<DataDigest<any, any>>
  visible: boolean
  created: boolean
  /* 图层数据形态由各子类解释，基类保持开放 */
  data: any
  options: Record<string, any>

  constructor(params: BaseLayerParams) {
    const { scene, earthGroup, R, tweenGroup, parent } = params
    this.scene = scene
    this.earthGroup = earthGroup
    this.R = R
    this.tweenGroup = tweenGroup
    this.parent = parent || earthGroup || scene || null

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
   * @param time
   */
  updateAnimation(time: number): void {
    this.animations.forEach(fn => {
      try { fn(time) } catch (_e) { /* ignore */ }
    })
  }

  /**
   * 注册每帧动画回调
   */
  _addAnimation(fn: (time: number) => void): (time: number) => void {
    if (typeof fn === 'function') {
      this.animations.push(fn)
    }
    return fn
  }

  /**
   * 创建图层：将 group 加入父节点，并调用子类 _build
   * @param data - 一并带上首帧数据，避免创建后立刻被 update 重建一遍
   * @param options - 构建选项
   */
  create(data?: any, options?: Record<string, any>): this {
    if (this.created) return this
    this.created = true

    if (data !== undefined) this.data = data
    if (options) this.options = options

    if (this.parent && this.group.parent !== this.parent) {
      this.parent.add(this.group)
    }

    this._build()
    this.group.visible = this.visible
    return this
  }

  /**
   * 更新图层数据
   * @param data
   * @param options
   */
  update(data: any, options: Record<string, any> = {}): this {
    // 还没创建就把数据交给 create —— 否则 _build 会先以 data=null 空跑一遍，
    // 再被下面的 _clear + _build 整个推翻。LandmarksLayer 这类 _build 不判 data
    // 的图层，每切一次就真的白建一遍再释放。
    if (!this.created) return this.create(data, options)
    this.data = data
    this.options = options
    this._clear()
    this._build()
    return this
  }

  /**
   * 销毁图层：停止动画、释放资源、移除 group
   */
  destroy(): this {
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
  show(): this {
    this.visible = true
    if (this.group) this.group.visible = true
    return this
  }

  /** 隐藏图层 */
  hide(): this {
    this.visible = false
    if (this.group) this.group.visible = false
    return this
  }

  /**
   * 向图层添加一个 Three.js 对象，并追踪以便释放
   */
  _add<T extends THREE.Object3D>(obj: T | null | undefined): T | null | undefined {
    if (!obj) return obj
    this.group.add(obj)
    this.objects.push(obj)
    return obj
  }

  /**
   * 从图层移除并释放一个已追踪的 Three.js 对象
   */
  _remove<T extends THREE.Object3D>(obj: T | null | undefined): T | null | undefined {
    if (!obj) return obj
    if (obj.userData?.transitionTweens) {
      obj.userData.transitionTweens.forEach((t: { stop(): void }) => { try { t.stop() } catch (_e) { /* ignore */ } })
    }
    if (obj.parent === this.group) this.group.remove(obj)
    disposeObject3D(obj)
    const idx = this.objects.indexOf(obj)
    if (idx >= 0) this.objects.splice(idx, 1)
    return obj
  }

  /**
   * 创建一个 DataDigest 实例，用于差异更新图层对象
   */
  _createDigest<T = any, O = any>(options: DataDigestOptions<T, O>): DataDigest<T, O> {
    const digest = new DataDigest(options)
    this.digests.push(digest)
    return digest
  }

  /**
   * 使用 DataDigest 对比数据差异，并自动将新增/移除的对象加入/移出图层
   */
  _digestData(data: any, digest: DataDigest<any, any>): ReturnType<DataDigest<any, any>['update']> {
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
   */
  _addDisposable(obj: { dispose?: () => void } | null | undefined): { dispose?: () => void } | null | undefined {
    if (obj && typeof obj.dispose === 'function') {
      this.disposables.push(obj as { dispose(): void })
    }
    return obj
  }

  /**
   * 创建 Tween，自动使用传入的 tweenGroup 或全局 TWEEN
   */
  _createTween<T extends Record<string, any>>(target: T): TWEEN.Tween<T> {
    const tween = this.tweenGroup
      ? new TWEEN.Tween(target, this.tweenGroup)
      : new TWEEN.Tween(target)
    this.tweens.push(tween)
    return tween
  }

  /** 清空图层内已追踪的对象与自定义可释放对象 */
  _clear(): void {
    this.disposables.forEach(d => {
      try { d.dispose() } catch (_e) { /* ignore */ }
    })
    this.disposables = []
    this.animations = []
    this.digests.forEach(d => { try { d.clear() } catch (_e) { /* ignore */ } })
    this.digests = []

    // 必须从头弹：_remove 内部会对 this.objects 做 splice，
    // 用 forEach 迭代同一个数组会跳元素（删一个、游标前移一格 → 半数被跳过），
    // 被跳过的那些对象的 transitionTweens 就不会 stop，图层重建后旧 tween 仍在跑。
    while (this.objects.length > 0) this._remove(this.objects[0])
    this.objects = []

    // 清理未被追踪的遗留子节点
    while (this.group.children.length > 0) {
      const child = this.group.children[0]
      this.group.remove(child)
      disposeObject3D(child)
    }
  }

  /** 停止所有由该图层创建的 Tween */
  _stopTweens(): void {
    this.tweens.forEach(tween => {
      try { tween.stop() } catch (_e) { /* ignore */ }
    })
    this.tweens = []
  }

  /**
   * 子类实现：构建图层内容
   * 使用 this._add(...) / this._addDisposable(...) / this._createTween(...)
   */
  _build(): void {
    // subclass override
  }
}
