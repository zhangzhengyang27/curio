/**
 * 地图工具箱的 Viewer 工厂。
 *
 * 底图策略（凭据外部化 + 优雅降级，见 KNOWN_PITFALLS D1）：
 * - 配置了 VITE_TDT_TOKEN：天地图「卫星影像」为默认底图（低层级下观感即「地球」，
 *   不会像矢量图那样一大片灰白被误认为没加载），可一键切回矢量。
 * - 未配置：降级 OpenStreetMap，功能不受影响。
 * 全程不使用 Cesium Ion 资产，因此不需要 Ion token。
 *
 * ⚠ 天地图「浏览器端」key 会拒绝非浏览器 UA 的请求（curl/脚本直连 403、
 * code 301012），真浏览器不受影响。
 */
export function createMapViewer(Cesium, container) {
  const token = import.meta.env.VITE_TDT_TOKEN || ''
  let viewer

  if (token) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, token, TDT_LAYERS.img.base)),
      ...baseViewerOptions(),
    })
    viewer.imageryLayers.addImageryProvider(createTdtProvider(Cesium, token, TDT_LAYERS.img.anno))
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

  // 初始视角：华中上空约 700 万米——足以看清中国大陆轮廓与路网，
  //又不至于高到让矢量图变成一片灰白（曾因此被误认为「没加载出来」）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108, 32, 7_000_000),
  })
  return viewer
}

/** 切换天地图底图类型（'img' 卫星影像 / 'vec' 矢量），注记层随之联动 */
export function switchTdtBase(viewer, type) {
  const Cesium = window.Cesium
  const token = import.meta.env.VITE_TDT_TOKEN || ''
  if (!token) return
  const conf = TDT_LAYERS[type]
  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.addImageryLayer(new Cesium.ImageryLayer(createTdtProvider(Cesium, token, conf.base)))
  viewer.imageryLayers.addImageryProvider(createTdtProvider(Cesium, token, conf.anno))
}

const TDT_LAYERS = {
  img: { base: makeLayerConf('img', 'img_w'), anno: makeLayerConf('cia', 'cia_w') },
  vec: { base: makeLayerConf('vec', 'vec_w'), anno: makeLayerConf('cva', 'cva_w') },
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
