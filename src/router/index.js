import { createRouter, createWebHistory } from 'vue-router'
import EarthView from '../views/EarthView.vue'
import ThreeGlobeGallery from '../views/ThreeGlobeGallery.vue'
import GlobeDemo from '../views/GlobeDemo.vue'
import ExampleGallery from '../examples/views/ExampleGallery.vue'
import ExampleDemo from '../examples/views/ExampleDemo.vue'

const routes = [
  { path: '/', name: 'earth', component: EarthView },
  { path: '/three-globe', name: 'gallery', component: ThreeGlobeGallery },
  { path: '/three-globe/:example', name: 'globe-demo', component: GlobeDemo, props: true },
  { path: '/examples', name: 'example-gallery', component: ExampleGallery },
  { path: '/examples/:source/:pathMatch(.*)*', name: 'example-demo', component: ExampleDemo, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
