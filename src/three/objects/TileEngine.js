import SlippyMapGlobe from 'three-slippy-map-globe'
import { disposeObject3D } from '../gc.js'

/**
 * 创建瓦片地球引擎
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {function} options.tileUrl - (x, y, level) => string
 * @param {number} [options.maxLevel=17] - 最大瓦片层级
 * @param {number} [options.minLevel=0] - 最小瓦片层级
 * @param {boolean} [options.mercatorProjection=true] - 瓦片是否使用墨卡托投影
 * @param {number} [options.curvatureResolution=64] - 球体几何细分段数
 * @returns {SlippyMapGlobe}
 */
export function createTileEngine(R, options = {}) {
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
 * @param {SlippyMapGlobe|null} engine
 * @param {THREE.Camera} camera
 */
export function updateTileEnginePOV(engine, camera) {
  if (!engine || !camera || !engine.visible) return
  if (typeof engine.updatePov === 'function') {
    engine.updatePov(camera)
  }
}

/**
 * 释放瓦片引擎资源
 * @param {SlippyMapGlobe|null} engine
 */
export function disposeTileEngine(engine) {
  if (!engine) return
  if (typeof engine.clearTiles === 'function') {
    engine.clearTiles()
  }
  if (engine.parent) {
    engine.parent.remove(engine)
  }
  disposeObject3D(engine)
}
