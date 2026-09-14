/**
 * 地图工具箱的 Viewer 工厂。
 *
 * 底图策略（凭据外部化 + 优雅降级，见 KNOWN_PITFALLS D1）：
 * - 配置了 VITE_TDT_TOKEN：天地图矢量底图（vec_w）+ 中文注记（cva_w）
 * - 未配置：降级 OpenStreetMap，功能不受影响
 * 全程不使用 Cesium Ion 资产，因此不需要 Ion token。
 */
export function createMapViewer(Cesium, container) {
  const token = import.meta.env.VITE_TDT_TOKEN || ''
  let viewer

  if (token) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, token, 'vec', 'vec_w')),
      ...baseViewerOptions(),
    })
    viewer.imageryLayers.addImageryProvider(createTdtProvider(Cesium, token, 'cva', 'cva_w'))
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

  // 初始视角：东亚上空
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(105, 35, 12_000_000),
  })
  return viewer
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

function createTdtProvider(Cesium, token, layer, matrixSet) {
  return new Cesium.WebMapTileServiceImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${matrixSet}/wmts?service=WMTS&version=1.0.0` +
      `&request=GetTile&tilematrix={TileMatrix}&tilematrixset=w&layer=${layer}` +
      `&style=default&format=tiles&tk=${token}`,
    layer,
    style: 'default',
    format: 'tiles',
    tileMatrixSetID: 'w',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
  })
}
