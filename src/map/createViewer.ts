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
/* 引擎是预编译 Build 产物，无类型可依 */
import { tileProxyBase, tileProxyEnabled } from './tileSource'

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
 * 天地图瓦片并发上限（原为 1，见 docs/KNOWN_PITFALLS.md D3 缓解第 5 条 —— 已按下列实测推翻）。
 *
 * 天地图 t0~t7 全部 `ALPN=http/1.1`（无 h2 多路复用）且解析到同一 IP，于是
 * Chrome「每主机 6 连接」是硬上限：并发设成 1 不是保守，是连浏览器允许的
 * 1/6 都不用满。而单张瓦片实测 p50 113~225ms、p95 937ms、首包 803ms，
 * 一次视角切换要 150~270 张 —— 串行下光排队就是十几秒量级。
 * 实测两片新海域各飞一次：并发 1 补齐 5.2s，并发 6 补齐 2.5s。
 *
 * 取 6 而不是更高：D3 记录过 48 并发（8 子域名 × 6）必触发限流，返回
 * 103B 素色 / 4769B 带字占位图。实测单主机 8 并发（同一 key）、16 并发
 * （轮转 5 个 key）全部返回真图未见占位；6 = 单主机连接数上限，
 * 不叠加子域名放大并发。⚠ 再往上调必须重跑占位反验。
 */
export const TDT_REQUESTS_PER_SERVER = 6

/**
 * 影像模式下矢量兜底层的层级上限。
 *
 * img 模式 = 矢量底 + 影像 + 影像注记三层，而 img_w 是不透明 JPEG：矢量层
 * 在城市级以下 100% 被遮挡，却照旧参与选片。实测 60km 近景：不限层级时
 * 一次视角切换要为这张看不见的层发 **31 张** L9~L11 瓦片，限到 L6 后为 **0 张**
 * （L6 已在缓存里，直接复用放大）。看板常用的 450km 视角下两者无差别 ——
 * 那个层级 SSE 已经停在 L7，收益体现在近景与用户放大时。
 *
 * 为什么不直接 `show=false`：实测那样该层请求数也能归零，但影像流式到达的
 * 2~3 秒里未覆盖区会露出 globe baseColor 深色底，观感等于「地图没加载出来」
 * （D3 里被反复反馈的那类问题）。限层级保留了兜底。
 */
export const VEC_FALLBACK_MAX_LEVEL = 6

/**
 * globe 精分阈值与瓦片缓存。默认 2 / 100 对「三层底图」这个场景太保守。
 *
 * SSE 2→3 是这轮优化里最大的一项：在与用户反馈截图同视角
 * （波多黎各，45 万米）实测一屏 globe 瓦片 **27 张 → 9 张**（且不再出现 L8），
 * 三层叠加下等于 81 张影像瓦片 → 27 张。
 * tileCacheSize=100 的问题在另一头：三层 × 一屏瓦片，平移回来基本已被淘汰，
 * 只能重新下载。
 */
export const GLOBE_MAX_SCREEN_SPACE_ERROR = 3
export const GLOBE_TILE_CACHE_SIZE = 400

/**
 * 天地图 key 池：VITE_TDT_TOKEN 支持逗号分隔多个 key（每人最多 5 个），
 * 每创建一个图层 provider 轮换一个——分摊单 key 的日配额（影像底图个人 key
 * 仅 1 万次/天）与并发限流。
 *
 * ⚠ 走同源瓦片反代时 key 不出现在 URL 里（改由 server/ 的 TDT_TOKEN 持有），
 * 但「配了 key」仍然是前端判断「底图用天地图而不是 OSM 降级」的开关，
 * 所以这里照旧读它。
 */
const TDT_TOKENS: string[] = (import.meta.env.VITE_TDT_TOKEN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
let tdtKeyCursor = 0

/** 底图能不能用天地图：配了浏览器 key，或同源反代已确认可用 */
function tdtAvailable(): boolean {
  return TDT_TOKENS.length > 0 || tileProxyEnabled()
}

function nextTdtToken(): string {
  const t = TDT_TOKENS[tdtKeyCursor % TDT_TOKENS.length]
  tdtKeyCursor++
  return t
}

export function createMapViewer(
  Cesium: any,
  container: HTMLElement,
  options: {
    /** 'vec' 纯矢量 / 'img' 卫星（矢量兜底） */
    mode?: 'vec' | 'img'
    view?: { lon: number; lat: number; height: number }
    maxZoom?: number
    /**
     * 高空（影像门控期）把矢量底图压暗成深灰蓝。
     * 全球视角必然高于 IMG_VISIBLE_MAX_HEIGHT，不压暗就是大面积米白，
     * 压在深色玻璃面板下首屏观感等于「地图没加载出来」（KNOWN_PITFALLS D3）。
     */
    dimBaseAtHighAltitude?: boolean
    /** 空闲按需渲染（看板页省 GPU）；实体变更需自行 scene.requestRender() */
    idleRender?: boolean
  } = {}
): any {
  Cesium.RequestScheduler.requestsPerServer = TDT_REQUESTS_PER_SERVER
  const {
    mode = 'vec',
    view = { lon: 114.3, lat: 30.6, height: 350_000 },
    maxZoom = MAX_ZOOM_DISTANCE,
    dimBaseAtHighAltitude = false,
    idleRender = false,
  } = options
  let viewer: any

  if (tdtAvailable()) {
    viewer = new Cesium.Viewer(container, {
      baseLayer: new Cesium.ImageryLayer(createTdtProvider(Cesium, TDT_LAYERS.vec.base)),
      ...baseViewerOptions(idleRender),
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
      ...baseViewerOptions(idleRender),
    })
  }

  // 初始视角：可在 options.view 覆盖（分析页用全球视角，工具箱用武汉城区）。
  // ⚠ 天地图矢量图在「高空 + 陆地」视角下就是大面积米白色，曾被用户
  // 一致反馈为「地图没加载出来」。工具箱页初始必须落在城市级，路网/长江/注记
  // 肉眼立辨，见 docs/KNOWN_PITFALLS.md D3。
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(view.lon, view.lat, view.height),
  })

  applyViewerConstraints(Cesium, viewer, maxZoom, dimBaseAtHighAltitude)
  return viewer
}

/**
 * viewer 创建后的统一约束（缩放边界、双击行为、影像层高度门控）。
 * createMapViewer 内部调用；vue-cesium 示例页（ToolsExampleShell）在 @ready
 * 后对 vc-viewer 自建 viewer 调用同一份——保证两条创建路径行为一致。
 */
export function applyViewerConstraints(Cesium: any, viewer: any, maxZoom = MAX_ZOOM_DISTANCE, dimBaseAtHighAltitude = false): void {
  // 拉远上限：天地图 L1~2 是全球占位区，禁止进入
  const ssc = viewer.scene.screenSpaceCameraController
  ssc.minimumZoomDistance = 20_000
  ssc.maximumZoomDistance = maxZoom

  // 精分阈值与瓦片缓存（默认 2 / 100）。
  // 三层底图一屏就要 57 个 globe 瓦片 × 3 张纹理，tileCacheSize=100 意味着
  // 平移回来基本已被淘汰、只能重新下载；SSE 2 会把瓦片精分到 L8，
  // 而城市级视角下 L7 与 L8 的肉眼差异远小于它多花的一倍瓦片。
  viewer.scene.globe.maximumScreenSpaceError = GLOBE_MAX_SCREEN_SPACE_ERROR
  viewer.scene.globe.tileCacheSize = GLOBE_TILE_CACHE_SIZE

  // 禁用 Cesium 默认双击缩放/追踪实体：双击是工具箱结束采点的通道(由独立
  // ScreenSpaceEventHandler 处理,不受影响),而默认 zoom 动画会在采点结束后
  // 仍持续移动相机,让刚画完的实体投影漂移、后续点击拾取失配。
  // vue-cesium 的绘制/量测用自建 ScreenSpaceEventHandler,同样不受影响。
  viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
  )

  if (dimBaseAtHighAltitude) viewer.__tdtDimBase = viewer.imageryLayers.get(0)

  // 影像层按相机高度显隐（minimumTerrainLevel 实测拦不住低层级占位瓦片）
  viewer.scene.preRender.addEventListener(() => {
    const gated = viewer.__tdtImgGated
    const dim = viewer.__tdtDimBase
    if ((!gated || gated.length === 0) && !dim) return
    const h = viewer.camera.positionCartographic.height
    const show = h <= IMG_VISIBLE_MAX_HEIGHT
    gated.forEach((layer: { show: boolean }) => { layer.show = show })
    if (dim) {
      // 门控期压暗+去饱和：大陆轮廓与国界仍在，但不再是刺眼米白
      const brightness = show ? 1 : 0.34
      const saturation = show ? 1 : 0.3
      if (dim.brightness !== brightness) {
        dim.brightness = brightness
        dim.saturation = saturation
      }
    }
  })
}

/** 切换天地图底图模式：'img' 卫星（矢量兜底+影像+注记）/ 'vec' 矢量（矢量+注记） */
export function applyTdtStack(viewer: any, mode: 'vec' | 'img'): void {
  const Cesium = window.Cesium!
  if (!tdtAvailable()) return
  viewer.imageryLayers.removeAll()
  // 矢量永远在最底层兜底：低层级时影像层隐藏，露出矢量而不是占位图。
  // ⚠ 但影像模式下它被不透明的 img_w 100% 遮挡，只用于「影像还没到」的空窗，
  // 所以限到 VEC_FALLBACK_MAX_LEVEL —— 纯矢量模式（分析页/工作台/工具箱）反过来
  // 拿它当真正的底图，必须放开到 18。
  viewer.imageryLayers.add(
    new Cesium.ImageryLayer(
      createTdtProvider(Cesium, TDT_LAYERS.vec.base, mode === 'img' ? VEC_FALLBACK_MAX_LEVEL : 18)
    )
  )

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

interface TdtLayerConf {
  layer: string
  matrixSet: string
}

const TDT_LAYERS: Record<'vec' | 'img', { base: TdtLayerConf; anno: TdtLayerConf }> = {
  vec: { base: makeLayerConf('vec', 'vec_w'), anno: makeLayerConf('cva', 'cva_w') },
  img: { base: makeLayerConf('img', 'img_w'), anno: makeLayerConf('cia', 'cia_w') },
}

function makeLayerConf(layer: string, matrixSet: string): TdtLayerConf {
  return { layer, matrixSet }
}

function createTdtProvider(Cesium: any, conf: TdtLayerConf, maxLevel = 18): any {
  // 走同源反代时：URL 里没有 tk（key 只在服务端→上游那一段），
  // 于是同一张瓦片的 URL 恒定 → 浏览器 max-age=432000 与反代磁盘缓存都吃得满。
  if (tileProxyEnabled()) {
    return new Cesium.UrlTemplateImageryProvider({
      url: `${tileProxyBase()}/${conf.layer}/{z}/{x}/{y}`,
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      maximumLevel: maxLevel,
    })
  }
  // ⚠ 一个 provider 固定一个 key，而不是每张瓦片换一次 key：
  // 天地图返回 `cache-control: max-age=432000`（5 天），但 tk 在 URL 里，
  // 每请求轮换会让同一张瓦片的 URL 随请求顺序漂移 → 缓存命中率不稳定，
  // 等于每次进页面重下一遍瓦片。按层分配 key 同时保住「多 key 分摊配额」的初衷。
  const key = nextTdtToken()
  // 用 UrlTemplateImageryProvider 而非 WMTS provider：{key} 自定义标签把上面
  // 选定的 key 拼进 URL。天地图 WMTS 兼容 REST 风格 GetTile（z/x/y 即 tilematrix/tilecol/tilerow）。
  return new Cesium.UrlTemplateImageryProvider({
    url:
      `https://t{s}.tianditu.gov.cn/${conf.matrixSet}/wmts?service=WMTS&version=1.0.0` +
      `&request=GetTile&tilematrix={z}&tilerow={y}&tilecol={x}` +
      `&tilematrixset=w&layer=${conf.layer}&style=default&format=tiles&tk={key}`,
    subdomains: ['0'],
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    maximumLevel: maxLevel,
    customTags: { key: () => key },
  })
}

function baseViewerOptions(idleRender = false): Record<string, unknown> {
  const opts: Record<string, unknown> = {
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
    // 天空盒/日/月是 Viewer 默认开启的三样东西，而这几页全是「俯视地表」的看板视角：
    // 实测为它们多拉 6 张天空盒 JPG（868KB）+ moonSmall + 星表，并且每帧多画一遍
    // 天空盒与日月。关掉后 cesium 资产请求从 12 条 / 27.7MB 解码量降到只剩引擎本体。
    skyBox: false,
    sun: false,
    moon: false,
  }
  if (idleRender) {
    // 看板页空闲时不烧 60fps；0.5s 兜底保证门控/瓦片变化最多滞后半秒上屏
    opts.requestRenderMode = true
    opts.maximumRenderTimeChange = 0.5
  }
  return opts
}
