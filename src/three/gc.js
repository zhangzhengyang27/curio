/**
 * Three.js 内存回收工具
 * 递归释放 geometry / material / texture / 自定义 dispose
 */

const TEXTURE_KEYS = [
  'map', 'alphaMap', 'bumpMap', 'normalMap', 'specularMap',
  'envMap', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'aoMap',
  'displacementMap', 'lightMap', 'gradientMap'
]

/**
 * 释放材质及其纹理
 * @param {THREE.Material|THREE.Material[]} material
 */
export function disposeMaterial(material) {
  if (!material) return
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial)
    return
  }
  TEXTURE_KEYS.forEach(key => {
    if (material[key]) material[key].dispose()
  })
  material.dispose()
}

/**
 * 递归释放 Object3D 及其子对象资源
 * @param {THREE.Object3D} obj
 */
export function disposeObject3D(obj) {
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
    obj.dispose()
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
 * @param {THREE.Group} group
 */
export function disposeGroup(group) {
  if (!group) return
  disposeObject3D(group)
  if (typeof group.clear === 'function') {
    group.clear()
  }
}

/**
 * 清空对象子节点并释放所有资源（不释放对象自身）
 * 等同于 while(children.length) { remove + deallocate }
 * @param {THREE.Object3D} obj
 */
export function emptyObject(obj) {
  if (obj && obj.children) {
    while (obj.children.length) {
      const child = obj.children[0]
      obj.remove(child)
      disposeObject3D(child)
    }
  }
}
