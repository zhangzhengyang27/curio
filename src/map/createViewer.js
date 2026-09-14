/**
 * 地图工具箱的 Viewer 工厂。
 *
 * 底图策略（凭据外部化 + 优雅降级，见 KNOWN_PITFALLS D1/D3）：
 * - 配置了 VITE_TDT_TOKEN：默认「矢量」底图（vec+cva，从未出过占位问题），
 *   卫星影像（vec 兜底 + img+cia）为可切换项。
 * - 未配置：降级 OpenStreetMap，功能不受影响。
 * 全程不使用 Cesium Ion 资产，因此不需要 Ion token。
 *
 * ⚠ 天地图已知行为（2026-09 逐层级实测 + 社区结论）：
 * 1. img_w 影像在国内是「半覆盖」：L3~4 整片「无影像」占位（带字 4769B），
 *    L5 瓦片也带部分水印（武汉样本 3% 水印像素），L6 起才是纯净卫星图
 *    → 影像层 minimumTerrainLevel = 6，之下由底层矢量兜底。
 * 2. 天地图「浏览器端」key 拒绝非浏览器 UA 的请求（脚本直连 403、code 301012）。
 * 3. 域名必须用 tianditu.gov.cn（旧 tianditu.com 不支持 https）。
 * 4. 个人 key 影像底图日配额 1 万次 + 并发限流；超限同样返回占位图（见 D3）。
 */
export const IMG_MIN_TERRAIN_LEVEL = 6

/**
 * 天地图 key 池：VITE_TDT_TOKEN 支持逗号分隔多个 key（每人最多 5 个），
 * 每创建一个图层 provider 轮换一个——分摊单 key 的日配额（影像底图个人 key
 * 仅 1 万次/天）与并发限流。
 */
const TDT_TOKENS = (import.meta.env.VITE_TDT_TOKEN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
let tdtKeyCursor = 0

function nextTdtToken() {
  const t = TDT_TOKENS[tdtKeyCursor % TDT_TOKENS.length]
  tdtKeyCursor++
  return t
}

export function createMapViewer(Cesium, container) {
  // 个人 key 有并发限流：8 个 t 子域名 × 默认 6 并发 = 48 并发会触发限流返回占位图
  Cesium.RequestScheduler.requestsPerServer = 3
  let viewer

  if (TDT_TOKENS.length) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.vec.base)),
      ...baseViewerOptions(),
    })
    applyTdtStack(viewer, 'vec')
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

  // 初始视角：华中上空约 180 万米（level 6~7：矢量路网/卫星细节清晰）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(110, 30.5, 1_800_000),
  })
  return viewer
}

/** 切换天地图底图模式：'img' 卫星（矢量兜底+影像+注记）/ 'vec' 矢量（矢量+注记） */
export function applyTdtStack(viewer, mode) {
  const Cesium = window.Cesium
  if (!TDT_TOKENS.length) return
  viewer.imageryLayers.removeAll()
  // 矢量永远在最底层兜底：低层级时影像层隐藏，露出矢量而不是占位图
  viewer.imageryLayers.add(new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.vec.base)))

  if (mode === 'img') {
    const img = new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.img.base))
    img.minimumTerrainLevel = IMG_MIN_TERRAIN_LEVEL
    viewer.imageryLayers.add(img)
    const cia = new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.img.anno))
    cia.minimumTerrainLevel = IMG_MIN_TERRAIN_LEVEL
    viewer.imageryLayers.add(cia)
  } else {
    viewer.imageryLayers.addImageryProvider(createTdtProvider(Cesium, TDT_LAYERS.vec.anno))
  }
}

const TDT_LAYERS = {
  vec: { base: makeLayerConf('vec', 'vec_w'), anno: makeLayerConf('cva', 'cva_w') },
  img: { base: makeLayerConf('img', 'img_w'), anno: makeLayerConf('cia', 'cia_w') },
}

function makeLayerConf(layer, matrixSet) {
  return { layer, matrixSet }
}

function createTdtProvider(Cesium, conf) {
  return new Cesium.WebMapTileServiceImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${conf.matrixSet}/wmts?service=WMTS&version=1.0.0` +
      `&request=GetTile&tilematrix={TileMatrix}&tilematrixset=w&layer=${conf.layer}` +
      `&style=default&format=tiles&tk=${nextTdtToken()}`,
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
