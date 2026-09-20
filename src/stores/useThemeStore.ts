import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function init() {
    const saved = localStorage.getItem('tv-theme')
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
    localStorage.setItem('tv-theme', isDark.value ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  watch(isDark, apply)

  return { isDark, init, toggle, apply }
})
