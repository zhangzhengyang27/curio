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
 * 1. img_w 影像在国内是「半覆盖」：L3~5 均为「无影像」占位（带字 4769B /
 *    素色变体，L5 武汉样本带 3% 水印像素），L6 起才是纯净卫星图
 *    → 影像层按相机高度显隐（≤150 万米可见）+ 拉远距离上限，
 *    由底层矢量兜底。minimumTerrainLevel 实测拦不住低层级占位瓦片。
 * 2. 天地图「浏览器端」key 拒绝非浏览器 UA 的请求（脚本直连 403、code 301012）。
 * 3. 域名必须用 tianditu.gov.cn（旧 tianditu.com 不支持 https）。
 * 4. 个人 key 影像底图日配额 1 万次 + 并发限流；超限同样返回占位图（见 D3）。
 */
/**
 * 影像层可见的相机高度上限（米）。
 * 天地图卫星影像没有全球低层级数据：相机高度超过约 150 万米
 * （level < 6）时服务端返回「无影像」占位图，必须隐藏影像层、
 * 露出矢量兜底；同时用 maximumZoomDistance 限制拉远范围，
 * 避免进入 L1~2 的全球占位区。
 */
export const IMG_VISIBLE_MAX_HEIGHT = 1_500_000
export const MAX_ZOOM_DISTANCE = 10_000_000

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

export function createMapViewer(Cesium, container, options = {}) {
  // 个人 key 有并发限流：8 个 t 子域名 × 默认 6 并发 = 48 并发会触发限流返回占位图
  // 实测：48 并发必触发天地图频控（返回 103B 素色 vec 占位 / 4769B 水印 img 占位），
  // 限流窗口数分钟后自动恢复。单子域名 × 1 并发 = 全局串行，最稳。
  Cesium.RequestScheduler.requestsPerServer = 1
  const {
    mode = 'vec', // 'vec' 纯矢量 / 'img' 卫星（矢量兜底）
    view = { lon: 114.3, lat: 30.6, height: 350_000 },
    maxZoom = MAX_ZOOM_DISTANCE,
  } = options
  let viewer

  if (TDT_TOKENS.length) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.vec.base)),
      ...baseViewerOptions(),
    })
    applyTdtStack(viewer, mode)
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

  // 初始视角：可在 options.view 覆盖（分析页用全球视角，工具箱用武汉城区）。
  // ⚠ 天地图矢量图在「高空 + 陆地」视角下就是大面积米白色，曾被用户
  // 一致反馈为「地图没加载出来」。工具箱页初始必须落在城市级，路网/长江/注记
  // 肉眼立辨，见 docs/KNOWN_PITFALLS.md D3。
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(view.lon, view.lat, view.height),
  })

  // 拉远上限：天地图 L1~2 是全球占位区，禁止进入
  const ssc = viewer.scene.screenSpaceCameraController
  ssc.minimumZoomDistance = 20_000
  ssc.maximumZoomDistance = maxZoom

  // 禁用 Cesium 默认双击缩放/追踪实体：双击是工具箱结束采点的通道(由独立
  // ScreenSpaceEventHandler 处理,不受影响),而默认 zoom 动画会在采点结束后
  // 仍持续移动相机,让刚画完的实体投影漂移、后续点击拾取失配
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  )

  // 影像层按相机高度显隐（minimumTerrainLevel 实测拦不住低层级占位瓦片）
  viewer.scene.preRender.addEventListener(() => {
    const gated = viewer.__tdtImgGated
    if (!gated || gated.length === 0) return
    const h = viewer.camera.positionCartographic.height
    const show = h <= IMG_VISIBLE_MAX_HEIGHT
    gated.forEach((layer) => { layer.show = show })
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
    const cia = new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.img.anno))
    viewer.imageryLayers.add(img)
    viewer.imageryLayers.add(cia)
    viewer.__tdtImgGated = [img, cia]
  } else {
    viewer.__tdtImgGated = []
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
  // 用 UrlTemplateImageryProvider 而非 WMTS provider：customTags 允许
  // 每个瓦片请求轮换一次 tk，把限流配额摊到多个 key 上（单 key 时等价直连）。
  // 天地图 WMTS 兼容 REST 风格 GetTile（z/x/y 即 tilematrix/tilecol/tilerow）。
  return new Cesium.UrlTemplateImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${conf.matrixSet}/wmts?service=WMTS&version=1.0.0` +
      `&request=GetTile&tilematrix={z}&tilerow={y}&tilecol={x}` +
      `&tilematrixset=w&layer=${conf.layer}&style=default&format=tiles&tk={key}`,
    subdomains: ['0'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: 18,
    customTags: { key: () => nextTdtToken() },
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
