/**
 * 地图工具箱的 Viewer 工厂。
 *
 * 底图策略（凭据外部化 + 优雅降级，见 KNOWN_PITFALLS D1）：
 * - 配置了 VITE_TDT_TOKEN：天地图底图，默认「卫星模式」= 矢量兜底 + 影像 + 影像注记，
 *   可切「矢量模式」= 矢量 + 矢量注记。
 * - 未配置：降级 OpenStreetMap，功能不受影响。
 * 全程不使用 Cesium Ion 资产，因此不需要 Ion token。
 *
 * ⚠ 天地图已知行为（2026-09 实测 + 社区结论）：
 * 1. img_w 在 level 3~4 对国内区域返回「此级别下，该区域无影像」占位图（4769B jpg），
 *    level 5 起才有真实影像 → 影像层必须 minimumTerrainLevel = 5，
 *    低层级由底层矢量兜底，任何缩放级别都不会露出占位文字。
 * 2. 天地图「浏览器端」key 拒绝非浏览器 UA 的请求（脚本直连 403、code 301012）。
 * 3. 域名必须用 tianditu.gov.cn（旧 tianditu.com 不支持 https）。
 */
export const IMG_MIN_TERRAIN_LEVEL = 5

export function createMapViewer(Cesium, container) {
  const token = import.meta.env.VITE_TDT_TOKEN || ''
  let viewer

  if (token) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, token, TDT_LAYERS.vec.base)),
      ...baseViewerOptions(),
    })
    applyTdtStack(viewer, 'img')
  } else {
    console.warn(
      '[map] 未配置 VITE_TDT_TOKEN，底图降级为 OpenStreetMap。' +
        '请在 .env.local 配置后重启以使用天地图。'
    )
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
      ),
      ...baseViewerOptions(),
    })
  }

  // 初始视角：华中上空约 280 万米（level 5~6，影像层已可用）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(110, 30.5, 2_800_000),
  })
  return viewer
}

/** 切换天地图底图模式：'img' 卫星（矢量兜底+影像+注记）/ 'vec' 矢量（矢量+注记） */
export function applyTdtStack(viewer, mode) {
  const Cesium = window.Cesium
  const token = import.meta.env.VITE_TDT_TOKEN || ''
  if (!token) return
  viewer.imageryLayers.removeAll()
  // 矢量永远在最底层兜底：低层级时影像层隐藏，露出矢量而不是占位图
  viewer.imageryLayers.add(new Cesium.ImageryLayer(createTdtProvider(Cesium, token, TDT_LAYERS.vec.base)))

  if (mode === 'img') {
    const img = new Cesium.ImageryLayer(createTdtProvider(Cesium, token, TDT_LAYERS.img.base))
    img.minimumTerrainLevel = IMG_MIN_TERRAIN_LEVEL
    viewer.imageryLayers.add(img)
    const cia = new Cesium.ImageryLayer(createTdtProvider(Cesium, token, TDT_LAYERS.img.anno))
    cia.minimumTerrainLevel = IMG_MIN_TERRAIN_LEVEL
    viewer.imageryLayers.add(cia)
  } else {
    viewer.imageryLayers.addImageryProvider(createTdtProvider(Cesium, token, TDT_LAYERS.vec.anno))
  }
}

const TDT_LAYERS = {
  vec: { base: makeLayerConf('vec', 'vec_w'), anno: makeLayerConf('cva', 'cva_w') },
  img: { base: makeLayerConf('img', 'img_w'), anno: makeLayerConf('cia', 'cia_w') },
}

function makeLayerConf(layer, matrixSet) {
  return { layer, matrixSet }
}

function createTdtProvider(Cesium, token, conf) {
  return new Cesium.WebMapTileServiceImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${conf.matrixSet}/wmts?service=WMTS&version=1.0.0` +
      `&request=GetTile&tilematrix={TileMatrix}&tilematrixset=w&layer=${conf.layer}` +
      `&style=default&format=tiles&tk=${token}`,
    layer: conf.layer,
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
  })
}

function baseViewerOptions() {
  return {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    navigationHelpButton: false,
  }
}
