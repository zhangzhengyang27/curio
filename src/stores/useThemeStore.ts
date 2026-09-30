import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const THEME_KEY = 'cu-theme'
/** 2026-09-30 M4 前 (TerraVista→Curio) 的旧键;读一次迁移后不再回读 */
const LEGACY_THEME_KEY = 'tv-theme'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function init() {
    // 隐私模式(如无痕浏览)下访问 localStorage 会直接抛错;
    // index.html 的预置脚本防了,store 自己不防的话 init 抛错会让应用起不来
    let saved: string | null = null
    try {
      saved = localStorage.getItem(THEME_KEY)
      if (saved === null) {
        // 一次性迁移:老用户的暗/亮偏好从旧键回填,此后不再读旧键
        saved = localStorage.getItem(LEGACY_THEME_KEY)
        if (saved !== null) {
          localStorage.setItem(THEME_KEY, saved)
          localStorage.removeItem(LEGACY_THEME_KEY)
        }
      }
    } catch { /* 偏好不可读:走默认值 */ }
    // 深空场景是地球应用的本命基调：首次访问（无保存偏好）一律进入暗色，
    // 明暗切换仍保留给用户，选择后记住。
    isDark.value = saved ? saved === 'dark' : true
    apply()
  }

  function apply() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
    } catch { /* 偏好不可持久化:不影响本次会话 */ }
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, apply)

  return { isDark, init, toggle, apply }
})
