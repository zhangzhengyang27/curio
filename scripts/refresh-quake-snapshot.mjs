/**
 * 刷新前端打包降级快照 public/data/quake-snapshot.json。
 *
 * 后端（server/）是 /monitor 的主数据源；这份快照只在「后端没起 + 浏览器也
 * 直连不上 USGS」时兜底（纯静态预览、离线演示）。数据可随时重抓，所以它
 * 进版本库但不进任何校验基线。
 */
import { writeFile } from 'node:fs/promises'

const FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
const OUT = new URL('../public/data/quake-snapshot.json', import.meta.url)

const res = await fetch(FEED, { signal: AbortSignal.timeout(30_000) })
if (!res.ok) throw new Error(`USGS HTTP ${res.status}`)
const body = await res.json()

const events = body.features
  .filter((f) => f.properties.mag != null && f.properties.type === 'earthquake')
  .map((f) => ({
    id: f.id,
    mag: f.properties.mag,
    place: f.properties.place || '未知位置',
    time: f.properties.time,
    depth: f.geometry.coordinates[2],
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    alert: f.properties.alert,
    url: f.properties.url,
  }))

await writeFile(OUT, `${JSON.stringify({ generatedAt: Date.now(), events }, null, 2)}\n`)
console.log(`[refresh-quake-snapshot] 写入 ${events.length} 条 → public/data/quake-snapshot.json`)
