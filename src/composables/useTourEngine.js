import { ref, computed, onUnmounted } from 'vue'

/**
 * 数据巡游引擎：按路线分镜串起「可视化模式切换 + 相机飞行 + 字幕」。
 *
 * 只负责编排与状态，不直接触碰 Three.js——场景操作通过回调注入，
 * 在 EarthView 中与 EarthCanvas 的 expose 对接；也便于脱离场景单测。
 *
 * 分镜 schema 与路线数据见 docs/TOUR_ROUTES.md：
 *   { mode, camera: { lon, lat }, flyDuration, dwell, caption: { title, text } }
 * 每一步时间轴 = flyDuration（飞行）+ dwell（停留），播完最后一步自动 stop()。
 * 退出时的场景还原（原可视化模式、自转开关）由 EarthView 监听 status 完成。
 */
export function useTourEngine({ switchMode, flyTo }) {
  const status = ref('idle') // idle | playing | paused
  const route = ref(null) // 当前路线对象
  const stepIndex = ref(0) // 0-based，URL 同步时 +1 转为 1-based
  const stepCount = computed(() => route.value?.steps.length ?? 0)
  const caption = ref(null) // 当前字幕 { title, text }

  let dwellTimer = null

  function clearTimer() {
    if (dwellTimer) {
      clearTimeout(dwellTimer)
      dwellTimer = null
    }
  }

  function applyStep(i, { schedule }) {
    const steps = route.value?.steps ?? []
    const idx = Math.max(0, Math.min(i, steps.length - 1))
    const step = steps[idx]
    stepIndex.value = idx
    caption.value = step.caption
    switchMode(step.mode)
    // china 模式自带 flyTo(104,35)，不再重复飞行
    if (step.camera && step.mode !== 'china') {
      flyTo(step.camera.lon, step.camera.lat, step.flyDuration ?? 2500)
    }
    clearTimer()
    if (schedule) {
      const total = (step.flyDuration ?? 2500) + (step.dwell ?? 8000)
      dwellTimer = setTimeout(() => {
        if (stepIndex.value >= steps.length - 1) stop()
        else if (status.value === 'playing') applyStep(stepIndex.value + 1, { schedule: true })
      }, total)
    }
  }

  /** 从路线选择进入：定位到某一步并立即播放 */
  function start(r, fromStep = 0) {
    route.value = r
    status.value = 'playing'
    applyStep(fromStep, { schedule: true })
  }

  /** 从分享链接进入：定位到某一步但不自动播放（用户按播放键才开始） */
  function loadAt(r, step = 0) {
    route.value = r
    status.value = 'paused'
    applyStep(step, { schedule: false })
  }

  function play() {
    if (!route.value || status.value === 'playing') return
    status.value = 'playing'
    applyStep(stepIndex.value, { schedule: true })
  }

  function pause() {
    if (status.value !== 'playing') return
    status.value = 'paused'
    clearTimer()
  }

  function toggle() {
    status.value === 'playing' ? pause() : play()
  }

  function next() {
    if (!route.value) return
    if (stepIndex.value < stepCount.value - 1) {
      // 手动步进只在「正在播放」时延续自动前进；暂停态下步进=浏览，不再挂定时器
      applyStep(stepIndex.value + 1, { schedule: status.value === 'playing' })
    } else stop()
  }

  function prev() {
    if (!route.value || stepIndex.value <= 0) return
    applyStep(stepIndex.value - 1, { schedule: status.value === 'playing' })
  }

  function goTo(i) {
    if (!route.value) return
    applyStep(i, { schedule: status.value === 'playing' })
  }

  /** 退出 / 播完最后一步。状态归位，场景还原由 EarthView 完成。 */
  function stop() {
    clearTimer()
    caption.value = null
    status.value = 'idle'
    route.value = null
    stepIndex.value = 0
  }

  onUnmounted(clearTimer)

  return { status, route, stepIndex, stepCount, caption, start, loadAt, play, pause, toggle, next, prev, goTo, stop }
}
