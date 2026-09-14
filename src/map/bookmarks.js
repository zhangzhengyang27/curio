/**
 * 地图书签：视角（经纬高 + 朝向）持久化到 localStorage。
 * 纯本地能力，无服务端依赖；导出/导入后续接 GeoJSON 工作流。
 */
const KEY = 'tv-map-bookmarks'

export function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function addBookmark(camera, name) {
  const Cesium = window.Cesium
  const carto = camera.positionCartographic
  const list = loadBookmarks()
  const bm = {
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

export function removeBookmark(id) {
  const list = loadBookmarks().filter((b) => b.id !== id)
  save(list)
  return list
}

export function flyToBookmark(camera, bm) {
  const Cesium = window.Cesium
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
