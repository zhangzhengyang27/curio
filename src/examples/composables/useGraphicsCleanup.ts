import { onMounted, onUnmounted } from 'vue'

/**
 * 安全的 graphics 示例 cleanup 机制
 *
 * 解决的问题：旧实现会对 window.requestAnimationFrame / setTimeout / addEventListener
 * 等全局 API 做 monkey-patch，多个示例同时挂载时会互相覆盖/提前恢复，导致 cleanup 失效。
 *
 * 新实现：
 * 1. 全局只 patch 一次，使用引用计数在所有示例都卸载后才恢复原始 API。
 * 2. 每个组件有独立的 key，patch 函数通过 activeKey 把资源注册到当前组件的集合中。
 * 3. rAF / setTimeout / setInterval 回调被包装，执行期间恢复 activeKey，使回调内部
 *    再次创建的资源仍归属到正确组件。
 */

interface CleanupState {
  rafIds: number[]
  timeouts: Array<[string, number]>
  listeners: Array<[string, string, any, any]>
  glContexts: any[]
  gfxLoadedScripts: Array<{ remove?(): void }>
}

const orig = {
  raf: window.requestAnimationFrame.bind(window),
  cancelRaf: window.cancelAnimationFrame.bind(window),
  setTimeout: window.setTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  clearInterval: window.clearInterval.bind(window),
  windowAdd: window.addEventListener.bind(window),
  docAdd: document.addEventListener.bind(document),
  getContext: HTMLCanvasElement.prototype.getContext
}

let patched = false
let refCount = 0
let activeKey: string | null = null
const registry = new Map<string, CleanupState>()

function ensurePatched() {
  if (patched) return
  patched = true

  window.requestAnimationFrame = ((cb: FrameRequestCallback, ...args: any[]) => {
    const key = activeKey
    const state = key ? registry.get(key) : null
    const wrapped = state
      ? (time: number) => {
          activeKey = key
          try {
            return cb(time)
          } finally {
            activeKey = null
          }
        }
      : cb
    const id = (orig.raf as any)(wrapped, ...args)
    if (state) state.rafIds.push(id)
    return id
  }) as typeof window.requestAnimationFrame

  window.cancelAnimationFrame = (id: number) => {
    registry.forEach((s) => {
      const idx = s.rafIds.indexOf(id)
      if (idx !== -1) s.rafIds.splice(idx, 1)
    })
    return orig.cancelRaf(id)
  }

  window.setTimeout = ((fn: any, delay?: number, ...args: any[]) => {
    const key = activeKey
    const state = key ? registry.get(key) : null
    const wrapped = state
      ? (...a: any[]) => {
          activeKey = key
          try {
            return fn(...a)
          } finally {
            activeKey = null
          }
        }
      : fn
    const id = (orig.setTimeout as any)(wrapped, delay, ...args)
    if (state) state.timeouts.push(['timeout', id])
    return id
  }) as typeof window.setTimeout

  window.setInterval = ((fn: any, delay?: number, ...args: any[]) => {
    const key = activeKey
    const state = key ? registry.get(key) : null
    const wrapped = state
      ? (...a: any[]) => {
          activeKey = key
          try {
            return fn(...a)
          } finally {
            activeKey = null
          }
        }
      : fn
    const id = (orig.setInterval as any)(wrapped, delay, ...args)
    if (state) state.timeouts.push(['interval', id])
    return id
  }) as typeof window.setInterval

  window.clearTimeout = ((id: number) => {
    registry.forEach((s) => {
      const idx = s.timeouts.findIndex(([kind, storedId]) => kind === 'timeout' && storedId === id)
      if (idx !== -1) s.timeouts.splice(idx, 1)
    })
    return orig.clearTimeout(id)
  }) as typeof window.clearTimeout

  window.clearInterval = ((id: number) => {
    registry.forEach((s) => {
      const idx = s.timeouts.findIndex(([kind, storedId]) => kind === 'interval' && storedId === id)
      if (idx !== -1) s.timeouts.splice(idx, 1)
    })
    return orig.clearInterval(id)
  }) as typeof window.clearInterval

  window.addEventListener = ((type: string, fn: any, opts?: any) => {
    const key = activeKey
    const state = key ? registry.get(key) : null
    if (state) state.listeners.push(['window', type, fn, opts])
    return orig.windowAdd.call(window, type, fn, opts)
  }) as typeof window.addEventListener

  document.addEventListener = ((type: string, fn: any, opts?: any) => {
    const key = activeKey
    const state = key ? registry.get(key) : null
    if (state) state.listeners.push(['document', type, fn, opts])
    return orig.docAdd.call(document, type, fn, opts)
  }) as typeof document.addEventListener

  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: any) {
    const ctx = orig.getContext.call(this, type, attrs)
    const key = activeKey
    const state = key ? registry.get(key) : null
    if (ctx && state && /^(webgl|webgl2|experimental-webgl)$/.test(type)) {
      state.glContexts.push(ctx)
    }
    return ctx
  } as typeof HTMLCanvasElement.prototype.getContext
}

function restoreGlobals() {
  window.requestAnimationFrame = orig.raf
  window.cancelAnimationFrame = orig.cancelRaf
  window.setTimeout = orig.setTimeout
  window.setInterval = orig.setInterval
  window.clearTimeout = orig.clearTimeout
  window.clearInterval = orig.clearInterval
  window.addEventListener = orig.windowAdd
  document.addEventListener = orig.docAdd
  HTMLCanvasElement.prototype.getContext = orig.getContext
  patched = false
  refCount = 0
}

export function useGraphicsCleanup(gfxLoadedScripts: Array<{ remove?(): void }> = []) {
  const key = Math.random().toString(36).slice(2)
  const state: CleanupState = {
    rafIds: [],
    timeouts: [],
    listeners: [],
    glContexts: [],
    gfxLoadedScripts
  }
  registry.set(key, state)

  onMounted(() => {
    ensurePatched()
    refCount++
    activeKey = key
  })

  onUnmounted(() => {
    activeKey = null

    state.rafIds.forEach((id) => {
      try {
        orig.cancelRaf(id)
      } catch (_e) { /* ignore */ }
    })

    state.timeouts.forEach(([kind, id]) => {
      try {
        if (kind === 'timeout') orig.clearTimeout(id)
        else orig.clearInterval(id)
      } catch (_e) { /* ignore */ }
    })

    state.listeners.forEach(([target, type, fn, opts]) => {
      try {
        if (target === 'window') window.removeEventListener(type, fn, opts)
        else document.removeEventListener(type, fn, opts)
      } catch (_e) { /* ignore */ }
    })

    state.glContexts.forEach((ctx) => {
      try {
        const ext = ctx.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      } catch (_e) { /* ignore */ }
    })

    state.gfxLoadedScripts.forEach((s) => {
      try {
        s.remove?.()
      } catch (_e) { /* ignore */ }
    })

    registry.delete(key)
    refCount--
    if (refCount <= 0) {
      restoreGlobals()
    }
  })

  function runInit(fn: () => unknown | Promise<unknown>) {
    activeKey = key
    return Promise.resolve(fn()).finally(() => {
      activeKey = null
    })
  }

  return { runInit }
}
