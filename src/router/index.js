import { createRouter, createWebHistory } from 'vue-router'

const EarthView = () => import('../views/EarthView.vue')
const ThreeGlobeGallery = () => import('../views/ThreeGlobeGallery.vue')
const GlobeDemo = () => import('../views/GlobeDemo.vue')
const ExampleGallery = () => import('../examples/views/ExampleGallery.vue')
const ExampleDemo = () => import('../examples/views/ExampleDemo.vue')
const BMapView = () => import('../views/BMap/index.vue')
const MapToolsView = () => import('../views/MapToolsView.vue')
const AnalysisView = () => import('../views/AnalysisView.vue')
const MonitorView = () => import('../views/MonitorView.vue')

const routes = [
  { path: '/', name: 'earth', component: EarthView },
  { path: '/three-globe', name: 'gallery', component: ThreeGlobeGallery },
  { path: '/three-globe/:example', name: 'globe-demo', component: GlobeDemo, props: true },
  { path: '/examples', name: 'example-gallery', component: ExampleGallery },
  { path: '/examples/:source/:pathMatch(.*)*', name: 'example-demo', component: ExampleDemo, props: true },
  { path: '/bmap', name: 'bmap', component: BMapView },
  { path: '/tools', name: 'map-tools', component: MapToolsView },
  { path: '/analysis', name: 'global-analysis', component: AnalysisView },
  { path: '/monitor', name: 'business-monitor', component: MonitorView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
