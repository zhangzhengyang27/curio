import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const EarthView = () => import('../views/EarthView.vue')
const ThreeGlobeGallery = () => import('../views/ThreeGlobeGallery.vue')
const GlobeDemo = () => import('../views/GlobeDemo.vue')
const ExampleGallery = () => import('../examples/views/ExampleGallery.vue')
const ExampleDemo = () => import('../examples/views/ExampleDemo.vue')
const BMapView = () => import('../views/BMap/index.vue')
const MapToolsGallery = () => import('../views/MapToolsGallery.vue')
const MapToolsExampleView = () => import('../views/MapToolsExampleView.vue')
const AnalysisView = () => import('../views/AnalysisView.vue')
const WorkbenchView = () => import('../views/WorkbenchView.vue')
const MonitorView = () => import('../views/MonitorView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const BRAND = 'TerraVista 3D'

// 标题取「用户在页面上看到的那个名字」（h1 / 面板主标题）；
// 顶栏导航文案已与页面名统一（2026-09-24 T02），标签页、导航、页面三者自洽。
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'earth', component: EarthView, meta: { title: `${BRAND} · 地球 3D 数据可视化` } },
  { path: '/three-globe', name: 'gallery', component: ThreeGlobeGallery, meta: { title: `ThreeGlobe 示例集 · ${BRAND}` } },
  { path: '/three-globe/:example', name: 'globe-demo', component: GlobeDemo, props: true, meta: { title: `ThreeGlobe 示例 · ${BRAND}` } },
  { path: '/examples', name: 'example-gallery', component: ExampleGallery, meta: { title: `示例中心 · ${BRAND}` } },
  { path: '/examples/:source/:pathMatch(.*)*', name: 'example-demo', component: ExampleDemo, props: true, meta: { title: `示例详情 · ${BRAND}` } },
  { path: '/bmap', name: 'bmap', component: BMapView, meta: { title: `百度地图示例集成 · ${BRAND}` } },
  { path: '/tools', name: 'map-tools-gallery', component: MapToolsGallery, meta: { title: `地图工具箱 · ${BRAND}` } },
  { path: '/tools/:slug', name: 'map-tools-example', component: MapToolsExampleView, props: true, meta: { title: `地图工具示例 · ${BRAND}` } },
  { path: '/analysis', name: 'global-analysis', component: AnalysisView, meta: { title: `全球数据分析 · ${BRAND}` } },
  { path: '/workbench', name: 'workbench', component: WorkbenchView, meta: { title: `分析工作台 · ${BRAND}` } },
  { path: '/monitor', name: 'business-monitor', component: MonitorView, meta: { title: `地震应急监测 · ${BRAND}` } },
  // 必须放最后：vue-router 按声明顺序匹配，通配符在前会吞掉上面所有路径。
  // 在此之前，未知路径只产生一条 console warn 并渲染成「导航条 + 空白」，
  // 界面上完全看不出是路由问题（/examples 的任意拼写错误都会静默白屏）。
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: `页面未找到 · ${BRAND}` } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * /bmap 的百度地图 GL SDK 只能在 HTML 解析期注入（document.write，见 KNOWN_PITFALLS C9），
 * 而 index.html 现在只为 /bmap 注入它。于是「从别的页面客户端路由跳到 /bmap」
 * 这条路径上 SDK 必然不在 —— 这里把它转成一次整页导航，让解析期注入生效。
 *
 * 三个不能触发的情况：
 * - 未配置 AK：交给页面自己的降级提示，重载也拿不到 SDK；
 * - 文档本身就是 /bmap：解析期那个 <script> 还在路上，重载会死循环；
 * - window.BMapGL 已存在：无需任何动作。
 */
router.beforeResolve((to) => {
  if (to.path !== '/bmap') return true
  if (window.BMapGL) return true
  if (!import.meta.env.VITE_BMAP_AK) return true
  if (window.location.pathname === '/bmap') return true
  window.location.assign(to.fullPath)
  return false
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = typeof title === 'string' ? title : BRAND
})

export default router
