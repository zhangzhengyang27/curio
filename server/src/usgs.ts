import type { QuakeRow, QuakeStore } from './db.ts'

export type UsgsFeed = '2.5_day' | '2.5_week'

interface UsgsFeature {
  id: string
  properties: {
    mag: number | null
    place: string | null
    time: number
    alert: string | null
    type: string
    url: string
  }
  geometry: { coordinates: [number, number, number] }
}

/**
 * USGS GeoJSON → 库行。丢弃无震级/非地震条目（台网噪声里 type 可能是
 * quarry、explosion），坐标顺序是 [lon, lat, depth]。
 */
export function mapFeature(f: UsgsFeature): QuakeRow | null {
  const p = f.properties
  if (p.mag == null || p.type !== 'earthquake') return null
  const [lon, lat, depth] = f.geometry.coordinates
  return {
    id: f.id,
    mag: p.mag,
    place: p.place || '未知位置',
    time: p.time,
    depth,
    lon,
    lat,
    alert: p.alert,
    url: p.url,
  }
}

export async function fetchFeed(usgsBase: string, feed: UsgsFeed, timeoutMs = 20_000): Promise<QuakeRow[]> {
  const res = await fetch(`${usgsBase}/earthquakes/feed/v1.0/summary/${feed}.geojson`, {
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`USGS ${feed} HTTP ${res.status}`)
  const body = (await res.json()) as { features: UsgsFeature[] }
  return body.features.map(mapFeature).filter((r): r is QuakeRow => r !== null)
}

/** 抓取并落库，返回写入行数。失败抛给调用方决定降级策略（库里的旧数据继续服务）。 */
export async function syncFeed(store: QuakeStore, usgsBase: string, feed: UsgsFeed): Promise<number> {
  const rows = await fetchFeed(usgsBase, feed)
  return store.upsert(rows)
}
