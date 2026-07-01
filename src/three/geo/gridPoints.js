// 射线法判断点是否在多边形内 (point-in-polygon)
export function pointInPolygon(point, vs) {
  const x = point[0], y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1]
    const xj = vs[j][0], yj = vs[j][1]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

// 多边形内生成等间距网格点
// polygon: [[lon, lat], ...]
export function gridPoint(polygon, spacing = 3) {
  const lonArr = polygon.map(p => p[0])
  const latArr = polygon.map(p => p[1])

  const lonMin = Math.floor(Math.min(...lonArr))
  const lonMax = Math.ceil(Math.max(...lonArr))
  const latMin = Math.floor(Math.min(...latArr))
  const latMax = Math.ceil(Math.max(...latArr))

  const cols = Math.ceil((lonMax - lonMin) / spacing)
  const rows = Math.ceil((latMax - latMin) / spacing)

  const rectPoints = []
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      rectPoints.push([lonMin + i * spacing, latMin + j * spacing])
    }
  }

  const innerPoints = rectPoints.filter(coord => pointInPolygon(coord, polygon))
  return [...polygon, ...innerPoints]
}

// 数组排序辅助
function compareNum(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

// 求经纬度极值范围（与原版兼容）
export function minMax(arr) {
  const sorted = [...arr].sort(compareNum)
  return [Math.floor(sorted[0]), Math.ceil(sorted[sorted.length - 1])]
}
