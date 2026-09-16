/**
 * /tools 示例注册表。
 *
 * `/tools` 是示例列表页（MapToolsGallery），`/tools/:slug` 是单个示例页
 * （MapToolsExampleView 按 slug 从这里懒加载 component）。
 * 新增示例：加一个条目 + 一个 .vue 文件即可，列表与路由自动生效。
 *
 * component 必须是动态 import 工厂：保证每个示例独立分包，
 * 进入列表页不加载 vue-cesium 与任何示例代码。
 *
 * 量测/绘制/分析/淹没四页依赖 vue-cesium 的绘制组件家族：
 * ⚠ :measurements/:drawings/:analyses 等 FAB 列表 prop 必须传稳定数组引用——
 * 内联 .map() 会在父组件重渲染时使其内部 action 表 computed 失效重建，
 * 点击链路静默失效（实测 3.2.12，见 docs/CHANGELOG.md 2026-09-17 条）。
 */
export const TOOLS_EXAMPLES = [
  {
    slug: 'toolbox',
    title: '综合工具箱',
    icon: '🧰',
    gradient: 'linear-gradient(135deg, #14324f 0%, #2f6f9f 100%)',
    tags: ['搜索', '量测', '标绘', '坐标转换', '导出'],
    desc: '地名搜索、量距量面、贴地距离与高程剖面、标绘顶点编辑、书签、坐标转换、GeoJSON/CSV 导出。',
    component: () => import('./ToolboxExample.vue'),
  },
  {
    slug: 'measurements',
    title: '量测',
    icon: '📐',
    gradient: 'linear-gradient(135deg, #123a2f 0%, #2f9f6e 100%)',
    tags: ['vue-cesium', '距离', '面积', '三角量算', '矩形圆'],
    desc: '距离/折线/面积/三角/水平/垂直/高度/坐标/矩形/正多边形/圆十一种量测，支持量测结果顶点编辑。',
    component: () => import('./MeasurementsExample.vue'),
  },
  {
    slug: 'drawings',
    title: '标绘',
    icon: '✏️',
    gradient: 'linear-gradient(135deg, #3a2a12 0%, #9f7a2f 100%)',
    tags: ['vue-cesium', '点线面', '矩形圆', '贴地'],
    desc: '图钉/点/线/面/矩形/圆/正多边形绘制，支持贴地与顶点编辑。',
    component: () => import('./DrawingsExample.vue'),
  },
  {
    slug: 'analyses',
    title: '通视与可视域',
    icon: '👁️',
    gradient: 'linear-gradient(135deg, #2c123a 0%, #7a2f9f 100%)',
    tags: ['vue-cesium', '通视', '可视域'],
    desc: '通视分析（两点视线遮挡检查）与可视域分析（视点可见范围，面向 3DTiles 建筑）。',
    component: () => import('./AnalysesExample.vue'),
  },
  {
    slug: 'flood',
    title: '淹没分析',
    icon: '🌊',
    gradient: 'linear-gradient(135deg, #0e2a3a 0%, #2f7f9f 100%)',
    tags: ['vue-cesium', '水位模拟', '地形'],
    desc: '指定区域水位上涨模拟。地形数据来自 ArcGIS 高程服务（需外网），加载失败时退化为平面演示。',
    component: () => import('./FloodExample.vue'),
  },
  {
    slug: 'navigation',
    title: '导航控件',
    icon: '🧭',
    gradient: 'linear-gradient(135deg, #33132a 0%, #9f2f5f 100%)',
    tags: ['vue-cesium', '罗盘', '比例尺'],
    desc: '罗盘、缩放、定位、打印、状态栏与距离比例尺等地图控件集合（vue-cesium VcNavigation）。',
    component: () => import('./NavigationExample.vue'),
  },
  {
    slug: 'overview-map',
    title: '鹰眼图',
    icon: '🗺️',
    gradient: 'linear-gradient(135deg, #0f2f45 0%, #2f8fbf 100%)',
    tags: ['vue-cesium', '小地图', '视野联动'],
    desc: '与主图视野双向联动的小地图：红框指示当前范围，点击小窗定位（VcOverviewMap）。',
    component: () => import('./OverviewMapExample.vue'),
  },
  {
    slug: 'print',
    title: '打印',
    icon: '🖨️',
    gradient: 'linear-gradient(135deg, #2c2c3a 0%, #7a7a9f 100%)',
    tags: ['vue-cesium', '截图', '导出'],
    desc: '一键把当前地图视图生成打印视图，可浏览器打印或另存 PDF（VcPrint）。',
    component: () => import('./PrintExample.vue'),
  },
  {
    slug: 'selection-indicator',
    title: '拾取指示器',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #3a2412 0%, #bf7a2f 100%)',
    tags: ['vue-cesium', '拾取', '取景框'],
    desc: '点击地图要素后取景框锁定并跟随目标，替代 Cesium 自带选择框（VcSelectionIndicator）。',
    component: () => import('./SelectionIndicatorExample.vue'),
  },
  {
    slug: 'navigation-sm',
    title: '小屏导航',
    icon: '🧿',
    gradient: 'linear-gradient(135deg, #12332f 0%, #2fa09f 100%)',
    tags: ['vue-cesium', '罗盘', '缩放'],
    desc: '紧凑版罗盘与「+/−」缩放控件，适合小尺寸地图容器（VcNavigationSm）。',
    component: () => import('./NavigationSmExample.vue'),
  },
  {
    slug: 'overlay-heatmap',
    title: '热力图',
    icon: '🔥',
    gradient: 'linear-gradient(135deg, #3a1212 0%, #bf4a2f 100%)',
    tags: ['vue-cesium', '热力图', 'heatmap.js'],
    desc: '武汉城市圈 360 个热力点的热度模拟，heatmap.js 渐变渲染叠加影像（VcOverlayHeatmap）。',
    component: () => import('./HeatmapExample.vue'),
  },
  {
    slug: 'overlay-html',
    title: 'HTML 覆盖物',
    icon: '🏷️',
    gradient: 'linear-gradient(135deg, #123a38 0%, #2f9f8a 100%)',
    tags: ['vue-cesium', 'HTML', '城市卡片'],
    desc: '把任意 HTML 钉在地理坐标上：5 张城市天气卡片，转到地球背面自动隐藏（VcOverlayHtml）。',
    component: () => import('./HtmlOverlayExample.vue'),
  },
  {
    slug: 'overlay-echarts',
    title: 'ECharts 图层',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #1a123a 0%, #5f2f9f 100%)',
    tags: ['vue-cesium', 'ECharts', '飞线'],
    desc: '武汉辐射 7 城的航线飞线图，effectScatter + lines 走 ECharts cesium 坐标系（VcOverlayEcharts）。',
    component: () => import('./EchartsOverlayExample.vue'),
  },
  {
    slug: 'overlay-typhoon',
    title: '台风路径',
    icon: '🌀',
    gradient: 'linear-gradient(135deg, #0e2a3a 0%, #2f7fbf 100%)',
    tags: ['vue-cesium', '台风', '风圈'],
    desc: '合成台风路径与 7/10/12 级风圈渲染、登陆点标注（VcOverlayTyphoon，示例数据）。',
    component: () => import('./TyphoonExample.vue'),
  },
  {
    slug: 'overlay-wind',
    title: '风场粒子',
    icon: '🌬️',
    gradient: 'linear-gradient(135deg, #101a3a 0%, #2f5fbf 100%)',
    tags: ['vue-cesium', '风场', 'GPU 粒子'],
    desc: '合成网格风场（西风 + 气旋涡旋）驱动的 GPU 粒子流动画（VcOverlayWind）。',
    component: () => import('./WindExample.vue'),
  },
  {
    slug: 'overlay-dynamic',
    title: '动态对象',
    icon: '🛩️',
    gradient: 'linear-gradient(135deg, #0f3a2a 0%, #2fbf7f 100%)',
    tags: ['vue-cesium', '时钟', '轨迹插值'],
    desc: 'SampledPositionProperty 驱动的环飞无人机，路径尾迹 + 时钟倍速回放（VcOverlayDynamic）。',
    component: () => import('./DynamicOverlayExample.vue'),
  },
  {
    slug: 'post-process',
    title: '扫描与后处理',
    icon: '📡',
    gradient: 'linear-gradient(135deg, #32123a 0%, #9f2f8a 100%)',
    tags: ['vue-cesium', '雷达扫描', '夜视滤镜'],
    desc: '雷达/圆环扫描圈与全屏夜视滤镜，后期处理管线示例（VcPostProcessStageScan / Stage / Collection）。',
    component: () => import('./PostProcessExample.vue'),
  },
]

export function getToolsExample(slug) {
  return TOOLS_EXAMPLES.find((e) => e.slug === slug) || null
}
