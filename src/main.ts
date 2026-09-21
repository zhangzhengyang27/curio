import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/theme.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
// 必须等路由解析完再挂载：App.vue 按 route.path 选外壳，而挂载瞬间 route 仍是
// 初始的 '/'。不等的话，直接访问 /examples 会先渲染产品外壳的导航再翻过来 —— 实测
// 冒烟用例就抓到了这一帧的错值。
//
// 但 isReady() 在初始导航失败时会 reject（本仓 1523 个懒加载 .vue，任一 import
// 失败即可触发），不接住的话 app.mount 永不执行 —— 白屏、无报错，正是最难查的那类。
// 导航失败也要挂载，让页面至少能出内容并在控制台留下痕迹。
router.isReady()
  .catch(err => {
    console.error('[main] 路由初始导航失败，仍继续挂载：', err)
  })
  .then(() => {
    app.mount('#app')
  })
