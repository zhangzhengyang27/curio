export interface RawQuake {
  id: string
  mag: number
  place: string
  time: number
  depth: number
  lon: number
  lat: number
  alert: string | null
  url: string
}

export type QuakeSourceMode = 'live' | 'snapshot'

export interface QuakePull {
  events: RawQuake[]
  mode: QuakeSourceMode
  generatedAt: number
}

interface ApiBody {
  events?: RawQuake[]
  generatedAt?: number
}

/** 后端地址；dev 由 vite 代理 /api → :8787，生产由 nginx 反代同源化 */
const API_BASE = (import.meta.env.VITE_QUAKE_API || '/api/quakes') as string
const FETCH_TIMEOUT_MS = 8000

async function getJson(url: string): Promise<ApiBody> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ApiBody
}

/**
 * 首屏拉取：后端 API 优先；后端没起且浏览器也拿不到 API 时退打包快照
 * （纯静态预览 / 离线演示）。快照由 scripts/refresh-quake-snapshot.mjs 生成。
 */
export async function pullInitial(): Promise<QuakePull> {
  try {
    const body = await getJson(`${API_BASE}?limit=200`)
    return { events: body.events ?? [], mode: 'live', generatedAt: body.generatedAt ?? Date.now() }
  } catch {
    const snap = await getJson('/data/quake-snapshot.json')
    return { events: snap.events ?? [], mode: 'snapshot', generatedAt: snap.generatedAt ?? 0 }
  }
}

/** 增量轮询：返回 since 之后的新事件；链路不可达返回 null，调用方保持现状 */
export async function pullNew(since: number): Promise<RawQuake[] | null> {
  try {
    const body = await getJson(`${API_BASE}?since=${since}&limit=200`)
    return body.events ?? []
  } catch {
    return null
  }
}
