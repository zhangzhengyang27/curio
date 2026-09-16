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
]

export function getToolsExample(slug) {
  return TOOLS_EXAMPLES.find((e) => e.slug === slug) || null
}
