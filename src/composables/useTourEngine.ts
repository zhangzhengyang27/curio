import { ref, computed, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'

/** 巡游分镜 schema，见 docs/TOUR_ROUTES.md */
export interface TourStep {
  mode?: string
  camera?: { lon: number; lat: number }
  flyDuration?: number
  dwell?: number
  caption: { title: string; text: string }
}

export interface TourRoute {
  steps: TourStep[]
}

export type TourStatus = 'idle' | 'playing' | 'paused'

export interface TourEngineOptions {
  /** 分镜无 mode 字段时不调用（纯相机巡游场景，如监控大屏） */
  switchMode?: (mode: string) => void
  /** 分镜无 camera 字段时不调用 */
  flyTo?: (lon: number, lat: number, durationMs?: number) => void
  /**
   * 覆盖自动前进的停留时长（ms），显式高于一切步骤自身 dwell。
   * 测试注入用（?tour-dwell=<ms>，同 ?nostream 惯例）：拉长首步定时器，
   * 让「暂停后再手动步进」的断言不与 10.5s 自动前进竞速。不传=步骤自带值。
   */
  dwellOverrideMs?: number
}

/**
 * 数据巡游引擎：按路线分镜串起「可视化模式切换 + 相机飞行 + 字幕」。
 *
 * 只负责编排与状态，不直接触碰场景——操作通过回调注入。
 * 每一步时间轴 = flyDuration（飞行）+ dwell（停留），播完最后一步自动 stop()。
 * 退出时的场景还原（原可视化模式、自转开关）由 EarthView 监听 status 完成。
 * X1(2026-09-15)：字段全部可选化，供监控巡游大屏(K3)等纯相机场景复用。
 */
export function useTourEngine(options: TourEngineOptions = {}): {
  status: Ref<TourStatus>
  route: Ref<TourRoute | null>
  stepIndex: Ref<number>
  stepCount: ComputedRef<number>
  caption: Ref<{ title: string; text: string } | null>
  start(route: TourRoute, fromStep?: number): void
  loadAt(route: TourRoute, step?: number): void
  play(): void
  pause(): void
  toggle(): void
  next(): void
  prev(): void
  goTo(i: number): void
  stop(): void
} {
  const { switchMode, flyTo, dwellOverrideMs } = options
  const status = ref<TourStatus>('idle')
  const route = ref<TourRoute | null>(null)
  const stepIndex = ref(0) // 0-based，URL 同步时 +1 转为 1-based
  const stepCount = computed(() => route.value?.steps.length ?? 0)
  const caption = ref<{ title: string; text: string } | null>(null)

  let dwellTimer: ReturnType<typeof setTimeout> | null = null

  function clearTimer(): void {
    if (dwellTimer) {
      clearTimeout(dwellTimer)
      dwellTimer = null
    }
  }

  function applyStep(i: number, { schedule }: { schedule: boolean }): void {
    const steps = route.value?.steps ?? []
    const idx = Math.max(0, Math.min(i, steps.length - 1))
    const step = steps[idx]
    stepIndex.value = idx
    caption.value = step.caption
    // 通用化(X1):mode/camera 均可选,按需调用注入的回调
    if (step.mode && switchMode) switchMode(step.mode)
    if (step.camera && flyTo) {
      flyTo(step.camera.lon, step.camera.lat, step.flyDuration ?? 2500)
    }
    clearTimer()
    if (schedule) {
      const dwell = dwellOverrideMs ?? step.dwell ?? 8000
      const total = (step.flyDuration ?? 2500) + dwell
      dwellTimer = setTimeout(() => {
        if (stepIndex.value >= steps.length - 1) stop()
        else if (status.value === 'playing') applyStep(stepIndex.value + 1, { schedule: true })
      }, total)
    }
  }

  /** 从路线选择进入：定位到某一步并立即播放 */
  function start(r: TourRoute, fromStep = 0): void {
    route.value = r
    status.value = 'playing'
    applyStep(fromStep, { schedule: true })
  }

  /** 从分享链接进入：定位到某一步但不自动播放（用户按播放键才开始） */
  function loadAt(r: TourRoute, step = 0): void {
    route.value = r
    status.value = 'paused'
    applyStep(step, { schedule: false })
  }

  function play(): void {
    if (!route.value || status.value === 'playing') return
    status.value = 'playing'
    applyStep(stepIndex.value, { schedule: true })
  }

  function pause(): void {
    if (status.value !== 'playing') return
    status.value = 'paused'
    clearTimer()
  }

  function toggle(): void {
    status.value === 'playing' ? pause() : play()
  }

  function next(): void {
    if (!route.value) return
    if (stepIndex.value < stepCount.value - 1) {
      // 手动步进只在「正在播放」时延续自动前进；暂停态下步进=浏览，不再挂定时器
      applyStep(stepIndex.value + 1, { schedule: status.value === 'playing' })
    } else stop()
  }

  function prev(): void {
    if (!route.value || stepIndex.value <= 0) return
    applyStep(stepIndex.value - 1, { schedule: status.value === 'playing' })
  }

  function goTo(i: number): void {
    if (!route.value) return
    applyStep(i, { schedule: status.value === 'playing' })
  }

  /** 退出 / 播完最后一步。状态归位，场景还原由 EarthView 完成。 */
  function stop(): void {
    clearTimer()
    caption.value = null
    status.value = 'idle'
    route.value = null
    stepIndex.value = 0
  }

  onUnmounted(clearTimer)

  return { status, route, stepIndex, stepCount, caption, start, loadAt, play, pause, toggle, next, prev, goTo, stop }
}
