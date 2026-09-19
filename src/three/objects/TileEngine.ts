import SlippyMapGlobe from 'three-slippy-map-globe'
import { disposeObject3D } from '../gc'
import type { Camera } from 'three'

/**
 * 创建瓦片地球引擎
 * @param R - 地球半径
 */
export function createTileEngine(
  R: number,
  options: {
    /** (x, y, level) => string；缺失时抛错 */
    tileUrl?: (x: number, y: number, level: number) => string
    /** 最大瓦片层级 */
    maxLevel?: number
    /** 最小瓦片层级 */
    minLevel?: number
    /** 瓦片是否使用墨卡托投影 */
    mercatorProjection?: boolean
    /** 球体几何细分段数 */
    curvatureResolution?: number
  } = {}
): SlippyMapGlobe {
  const {
    tileUrl,
    maxLevel = 17,
    minLevel = 0,
    mercatorProjection = true,
    curvatureResolution = 64
  } = options

  if (typeof tileUrl !== 'function') {
    throw new Error('createTileEngine requires a tileUrl function')
  }

  const engine = new SlippyMapGlobe(R, {
    tileUrl,
    minLevel,
    maxLevel,
    mercatorProjection
  })

  if (curvatureResolution != null) {
    engine.curvatureResolution = curvatureResolution
  }

  engine.name = 'tileEngine'
  engine.userData.isTileEngine = true

  return engine
}

/**
 * 根据相机位置更新瓦片引擎可见瓦片
 */
export function updateTileEnginePOV(engine: SlippyMapGlobe | null | undefined, camera: Camera | null | undefined): void {
  if (!engine || !camera || !engine.visible) return
  if (typeof engine.updatePov === 'function') {
    engine.updatePov(camera)
  }
}

/**
 * 释放瓦片引擎资源
 */
export function disposeTileEngine(engine: SlippyMapGlobe | null | undefined): void {
  if (!engine) return
  if (typeof engine.clearTiles === 'function') {
    engine.clearTiles()
  }
  if (engine.parent) {
    engine.parent.remove(engine)
  }
  disposeObject3D(engine)
}
