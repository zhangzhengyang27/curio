/**
 * 底图瓦片来源解析：直连天地图 vs 走同源瓦片反代（server/src/tiles.ts）。
 *
 * 为什么默认直连、反代要显式开启：反代依赖 server/ 在跑。没跑的时候
 * vite 代理会返回 504，底图整片出不来 —— 那比"没有 5 天缓存"严重得多。
 * 所以这里在模块加载时打一次 `/tiles/health`，**只有确认后端在**才走反代。
 *
 * ⚠ 探测是异步的，而 createMapViewer 是同步的。这依赖一条不变量：
 * 四个建图点（MonitorView / AnalysisView / WorkbenchView / ToolboxExample）
 * 都在 `await load()` 或 `await loadCesium()` 之后才建图，同源 health 请求
 * 在那些 await 期间早就返回了。万一这条不变量被破坏，退化结果是
 * 「本次走直连」——功能正常，只是少一层缓存，不会白屏。
 */

const PROXY_BASE = (import.meta.env.VITE_TILE_PROXY || '').trim()

let proxyOk = false
let probing: Promise<boolean> | null = null

export function tileProxyEnabled(): boolean {
  return PROXY_BASE.length > 0 && proxyOk
}

export function tileProxyBase(): string {
  return PROXY_BASE
}

/** 幂等：多次调用共用一次探测。模块加载即自动发起一次。 */
export function probeTileProxy(): Promise<boolean> {
  if (!PROXY_BASE) return Promise.resolve(false)
  if (probing) return probing
  probing = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1500)
    try {
      const res = await fetch(`${PROXY_BASE}/health`, { signal: ctrl.signal })
      if (!res.ok) return false
      const body = (await res.json()) as { ok?: boolean; enabled?: boolean }
      proxyOk = Boolean(body.ok && body.enabled)
    } catch {
      proxyOk = false
    } finally {
      clearTimeout(timer)
    }
    return proxyOk
  })()
  return probing
}

// 建图前的 await 窗口足够它返回；见文件头「不变量」说明
void probeTileProxy()
