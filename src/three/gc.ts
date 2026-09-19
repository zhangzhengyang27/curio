/**
 * Three.js 内存回收工具
 * 递归释放 geometry / material / texture / 自定义 dispose
 */
import type { Group, Material, Object3D } from 'three'

const TEXTURE_KEYS = [
  'map', 'alphaMap', 'bumpMap', 'normalMap', 'specularMap',
  'envMap', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'aoMap',
  'displacementMap', 'lightMap', 'gradientMap'
] as const

/**
 * three 对象与「带自定义 dispose 的宿主对象」(动画控制器、后处理器等)
 * 的最小公共结构 —— disposeObject3D 的入参两者都可能
 */
interface DisposableLike {
  dispose?: () => void
  isObject3D?: unknown
  isMaterial?: unknown
  isGeometry?: unknown
  isTexture?: unknown
  geometry?: { dispose(): void } | null
  material?: Material | Material[] | null
  children?: DisposableLike[]
}

/**
 * 释放材质及其纹理
 */
export function disposeMaterial(material: Material | Material[] | null | undefined): void {
  if (!material) return
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial)
    return
  }
  // 纹理键分散在各具体材质类型上，基类无统一索引签名
  const texMap = material as unknown as Partial<Record<(typeof TEXTURE_KEYS)[number], { dispose(): void } | null>>
  TEXTURE_KEYS.forEach(key => {
    texMap[key]?.dispose()
  })
  material.dispose()
}

/**
 * 递归释放 Object3D 及其子对象资源
 */
export function disposeObject3D(obj: DisposableLike | null | undefined): void {
  if (!obj) return

  // 调用非 Three.js 内置对象的自定义 dispose（如动画控制器、后处理器）
  if (
    typeof obj.dispose === 'function' &&
    !obj.isObject3D &&
    !obj.isMaterial &&
    !obj.isGeometry &&
    !obj.isTexture
  ) {
    obj.dispose()
  }

  if (obj.geometry) {
    obj.geometry.dispose()
  }

  if (obj.material) {
    disposeMaterial(obj.material)
  }

  if (obj.isTexture) {
    obj.dispose?.()
  }

  if (obj.children && obj.children.length) {
    // 复制数组避免遍历过程中 children 变化
    ;[...obj.children].forEach(disposeObject3D)
  }
}

/**
 * 兼容旧接口
 * @deprecated 使用 disposeObject3D
 */
export const deallocate = disposeObject3D

/**
 * 安全清空 Group（先递归 dispose 再 clear）
 */
export function disposeGroup(group: Group | null | undefined): void {
  if (!group) return
  disposeObject3D(group)
  if (typeof group.clear === 'function') {
    group.clear()
  }
}

/**
 * 清空对象子节点并释放所有资源（不释放对象自身）
 * 等同于 while(children.length) { remove + deallocate }
 */
export function emptyObject(obj: Object3D | null | undefined): void {
  if (obj && obj.children) {
    while (obj.children.length) {
      const child = obj.children[0]
      obj.remove(child)
      disposeObject3D(child)
    }
  }
}
