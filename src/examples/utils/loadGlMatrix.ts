let legacyPromise: Promise<void> | null = null
let modernPromise: Promise<void> | null = null

function loadScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = url
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${url}`))
    document.head.appendChild(s)
  })
}

/**
 * 加载旧版 glMatrix（0.9.6），全局提供 mat4 / vec3 等变量。
 * 多次调用会复用同一次加载。
 */
export function loadGlMatrixLegacy(url = '/webgl/study-webgl/libs/glMatrix-0.9.6.min.js') {
  if (legacyPromise) return legacyPromise
  legacyPromise = new Promise<void>((resolve, reject) => {
    if (typeof (globalThis as any).mat4 !== 'undefined' && typeof (globalThis as any).vec3 !== 'undefined') {
      resolve()
      return
    }
    loadScript(url).then(resolve).catch(reject)
  })
  return legacyPromise
}

/**
 * 加载新版 gl-matrix（3.x），全局提供 glMatrix 命名空间。
 * 多次调用会复用同一次加载。
 */
export function loadGlMatrixModern(url = '/webgl/study-webgl/libs/gl-matrix.js') {
  if (modernPromise) return modernPromise
  modernPromise = new Promise<void>((resolve, reject) => {
    if (typeof (globalThis as any).glMatrix !== 'undefined') {
      resolve()
      return
    }
    loadScript(url).then(resolve).catch(reject)
  })
  return modernPromise
}
