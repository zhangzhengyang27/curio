import * as THREE from 'three'

/**
 * earth-lessons 示例 baseUrl 管理
 *
 * 问题：原实现把当前 baseUrl 挂在 window.__EXAMPLE_BASE_URL__ 上，并通过
 * monkey-patch THREE.TextureLoader/FileLoader.prototype.load 来解析相对路径。
 * 这会造成全局 window 污染，且在多个示例切换时可能解析到错误的 baseUrl。
 *
 * 解决方案：
 * 1. 使用模块级栈保存当前活跃的 baseUrl，避免污染 window。
 * 2. 全局只 patch 一次 THREE loader，解析时取栈顶 baseUrl。
 * 3. 示例在 @ready 时 push，在 @before-dispose 时 pop。
 */

const baseUrlStack: string[] = []
let patched = false

function resolveEarthLessonsUrl(url: unknown): string {
  if (typeof url !== 'string') return url as string
  if (/^https?:\/\//.test(url) || url.startsWith('/')) return url
  const base = baseUrlStack[baseUrlStack.length - 1] || ''
  const relative = url.startsWith('./') ? url.slice(2) : url
  return base ? base + relative : relative
}

function ensurePatched() {
  if (patched) return
  patched = true

  const originalTextureLoad = THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load = function (this: any, url: string, onLoad?: any, onProgress?: any, onError?: any) {
    return originalTextureLoad.call(this, resolveEarthLessonsUrl(url), onLoad, onProgress, onError)
  } as typeof THREE.TextureLoader.prototype.load

  const originalFileLoad = THREE.FileLoader.prototype.load
  THREE.FileLoader.prototype.load = function (this: any, url: string, onLoad?: any, onProgress?: any, onError?: any) {
    return originalFileLoad.call(this, resolveEarthLessonsUrl(url), onLoad, onProgress, onError)
  } as typeof THREE.FileLoader.prototype.load
}

export function pushEarthLessonsBaseUrl(baseUrl: string) {
  ensurePatched()
  baseUrlStack.push(baseUrl)
}

export function popEarthLessonsBaseUrl() {
  baseUrlStack.pop()
}
