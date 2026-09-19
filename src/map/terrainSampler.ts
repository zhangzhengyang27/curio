/**
 * 地形高程采样源（M11，采样专用、不挂场景渲染）。
 *
 * 数据源：ArcGIS World Elevation3D 公开高程服务（无需 token），
 * Cesium 内置 ArcGISTiledElevationTerrainProvider.fromUrl 原生支持。
 *
 * ⚠ 刻意不把 provider 赋给 viewer.terrainProvider：CN 网络 + 全局串行调度下，
 * 地形渲染会持续产生 3s 级长任务把主线程拖卡（实测 PerformanceObserver 长任务
 * 连续 2.9~3.6s）。这里只用它做 sampleTerrain 的高程 oracle——贴地距离/剖面
 * 拿真实高程，场景保持椭球渲染零卡顿。将来换数据源只需改本文件。
 */
/* 引擎是预编译 Build 产物，无类型可依 */
const TERRAIN_URL =
  'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'

let samplerPromise: Promise<any> | null = null

/** 单例:fromUrl 失败会清空缓存允许重试 */
export function getArcgisTerrainSampler(): Promise<any> {
  const Cesium = window.Cesium!
  if (!samplerPromise) {
    const p: Promise<any> = Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(TERRAIN_URL)
    p.catch(() => { samplerPromise = null })
    samplerPromise = p
    return p
  }
  return samplerPromise
}
