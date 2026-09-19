/**
 * 地图书签：视角（经纬高 + 朝向）持久化到 localStorage。
 * 纯本地能力，无服务端依赖；导出/导入后续接 GeoJSON 工作流。
 */
/* camera 为预编译 Cesium 的 Camera 对象，无类型可依 */
export interface MapBookmark {
  id: string
  name: string
  lon: number
  lat: number
  height: number
  heading: number
  pitch: number
  createdAt: number
}

const KEY = 'tv-map-bookmarks'

export function loadBookmarks(): MapBookmark[] {
  try {
    return (JSON.parse(localStorage.getItem(KEY) as string) || []) as MapBookmark[]
  } catch {
    return []
  }
}

function save(list: MapBookmark[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function addBookmark(camera: any, name?: string): MapBookmark {
  const Cesium = window.Cesium!
  const carto = camera.positionCartographic
  const list = loadBookmarks()
  const bm: MapBookmark = {
    id: `bm_${Date.now()}`,
    name: name || `书签 ${list.length + 1}`,
    lon: +Cesium.Math.toDegrees(carto.longitude).toFixed(4),
    lat: +Cesium.Math.toDegrees(carto.latitude).toFixed(4),
    height: Math.round(carto.height),
    heading: +Cesium.Math.toDegrees(camera.heading).toFixed(1),
    pitch: +Cesium.Math.toDegrees(camera.pitch).toFixed(1),
    createdAt: Date.now(),
  }
  list.push(bm)
  save(list)
  return bm
}

export function removeBookmark(id: string): MapBookmark[] {
  const list = loadBookmarks().filter((b) => b.id !== id)
  save(list)
  return list
}

/** 重命名书签(M4);返回更新后的列表,名称为空则不改动 */
export function renameBookmark(id: string, name: string): MapBookmark[] {
  const trimmed = String(name || '').trim()
  if (!trimmed) return loadBookmarks()
  const list = loadBookmarks().map((b) => (b.id === id ? { ...b, name: trimmed } : b))
  save(list)
  return list
}

/** 导出全部书签为 JSON 字符串(M4,与导入对称) */
export function exportBookmarks(): string {
  return JSON.stringify(loadBookmarks(), null, 2)
}

/**
 * 导入书签 JSON(M4)。按 id 去重合并(同 id 保留已有),返回更新后的列表;
 * 结构非法或条目缺关键字段时跳过该条目。
 */
export function importBookmarks(jsonStr: string): { list: MapBookmark[]; imported: number } {
  let arr: any
  try {
    arr = JSON.parse(jsonStr)
  } catch {
    return { list: loadBookmarks(), imported: 0 }
  }
  if (!Array.isArray(arr)) return { list: loadBookmarks(), imported: 0 }
  const existing = loadBookmarks()
  const byId = new Map(existing.map((b) => [b.id, b]))
  let imported = 0
  for (const b of arr) {
    if (!b || typeof b.id !== 'string' || !Number.isFinite(b.lon) || !Number.isFinite(b.lat)) continue
    if (byId.has(b.id)) continue
    byId.set(b.id, {
      id: b.id,
      name: String(b.name || `书签 ${byId.size + 1}`),
      lon: b.lon,
      lat: b.lat,
      height: Number.isFinite(b.height) ? b.height : 350_000,
      heading: Number.isFinite(b.heading) ? b.heading : 0,
      pitch: Number.isFinite(b.pitch) ? b.pitch : -90,
      createdAt: Number.isFinite(b.createdAt) ? b.createdAt : Date.now(),
    })
    imported++
  }
  const list = [...byId.values()]
  save(list)
  return { list, imported }
}

export function flyToBookmark(camera: any, bm: MapBookmark): void {
  const Cesium = window.Cesium!
  camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(bm.lon, bm.lat, bm.height),
    orientation: {
      heading: Cesium.Math.toRadians(bm.heading),
      pitch: Cesium.Math.toRadians(bm.pitch),
      roll: 0,
    },
    duration: 1.6,
  })
}
