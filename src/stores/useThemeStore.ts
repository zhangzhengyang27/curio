import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function init() {
    // 隐私模式(如无痕浏览)下访问 localStorage 会直接抛错;
    // index.html 的预置脚本防了,store 自己不防的话 init 抛错会让应用起不来
    let saved: string | null = null
    try {
      saved = localStorage.getItem('tv-theme')
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
      localStorage.setItem('tv-theme', isDark.value ? 'dark' : 'light')
    } catch { /* 偏好不可持久化:不影响本次会话 */ }
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, apply)

  return { isDark, init, toggle, apply }
})
