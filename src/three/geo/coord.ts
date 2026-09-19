/**
 * 经纬度坐标转球面坐标
 */

export function lon2xyz(R: number, longitude: number, latitude: number): { x: number; y: number; z: number } {
  const lon = -longitude * Math.PI / 180 // three.js坐标系z轴对应经度-90度
  const lat = latitude * Math.PI / 180
  return {
    x: R * Math.cos(lat) * Math.cos(lon),
    y: R * Math.sin(lat),
    z: R * Math.cos(lat) * Math.sin(lon)
  }
}
