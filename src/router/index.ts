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

// 标题取「用户在页面上看到的那个名字」（h1 / 面板主标题），不取导航项文案——
// 两者目前并不一致（导航「业务监控」vs 页面「地震应急监测」，
// 导航「地图工具」vs 页面「地图工具箱」），标签页应当和打开后的页面自洽。
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

router.afterEach((to) => {
  const title = to.meta.title
  document.title = typeof title === 'string' ? title : BRAND
})

export default router
