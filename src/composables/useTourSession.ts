import { ref, shallowRef, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Ref } from 'vue'
import { useTourEngine } from './useTourEngine'
import type { TourRouteWithDuration } from '../three/tours/routes'

/**
 * 首页数据巡游会话(自 EarthView 原样迁出,行为等价):
 * 引擎包装、选线器开关、播放期自转保存/还原、?tour=&step= URL 同步、
 * 分享链接直达、播放中拖拽自动暂停。
 */
/** EarthView 画布实例的最小结构面(组件实例 Ref 结构兼容传入) */
interface CanvasLike {
  switchVisualization?: (mode: string) => void
  flyTo?: (lon: number, lat: number, duration?: number) => void
  getControls?: () => { addEventListener: (type: 'start', listener: () => void) => void } | null | undefined
}

export function useTourSession(options: {
  canvas: Ref<CanvasLike | null>
  currentVisualization: () => string
  isRotating: () => boolean
  setRotating: (v: boolean) => void
  /** 还原巡游前的可视化模式 */
  restoreViz: (mode: string) => void
}) {
  const { canvas, currentVisualization, isRotating, setRotating, restoreViz } = options

  // ?tour-dwell=<ms>:测试注入的自动前进停留时长(同 ?nostream 惯例),
  // 拉长首步定时器让「暂停后手动步进」类断言不与自动前进竞速;不传=分镜自带节奏
  const tourDwellOverride = (() => {
    const v = Number(new URLSearchParams(window.location.search).get('tour-dwell'))
    return Number.isFinite(v) && v > 0 ? v : undefined
  })()

  const tour = useTourEngine({
    switchMode: (mode: string) => canvas.value?.switchVisualization?.(mode),
    flyTo: (lon: number, lat: number, duration?: number) => canvas.value?.flyTo?.(lon, lat, duration),
    dwellOverrideMs: tourDwellOverride,
  })
  const tourRoutes = shallowRef<TourRouteWithDuration[] | null>(null)
  const tourPickerVisible = ref(false)
  const tourUIVisible = computed(() => tourPickerVisible.value || tour.status.value !== 'idle')

  async function openTourPicker() {
    if (!tourRoutes.value) {
      const mod = await import('../three/tours/routes')
      tourRoutes.value = mod.routes
    }
    tourPickerVisible.value = true
  }

  function handleTourPick(r: TourRouteWithDuration) {
    tourPickerVisible.value = false
    tour.start(r, 0)
  }

  function handleTourClose() {
    tourPickerVisible.value = false
    tour.stop()
  }

  // 播放开始时暂停自转并记住现场;退出/播完时还原可视化模式与自转
  let savedViz: string | null = null
  let savedRotate: boolean | null = null
  watch(tour.status, (s) => {
    if (s !== 'idle' && savedViz === null) {
      savedViz = currentVisualization()
      savedRotate = isRotating()
      setRotating(false)
    }
    if (s === 'idle' && savedViz !== null) {
      setRotating(savedRotate!)
      if (savedViz !== currentVisualization()) restoreViz(savedViz)
      savedViz = null
    }
  })

  // URL 状态:?tour=<id>&step=<n>(step 为 1-based),可刷新续播、可分享
  const routeInfo = useRoute()
  const router = useRouter()
  watch([tour.status, tour.stepIndex], ([status, idx]) => {
    if (status === 'idle' || !tour.route.value) {
      if (routeInfo.query.tour !== undefined) router.replace({ query: {} })
      return
    }
    const next = { tour: (tour.route.value as TourRouteWithDuration).id, step: String(idx + 1) }
    if (routeInfo.query.tour !== next.tour || routeInfo.query.step !== next.step) {
      router.replace({ query: next })
    }
  })

  // 分享链接直达:定位到指定步骤但不自动播放
  if (routeInfo.query.tour) {
    import('../three/tours/routes')
      .then((mod) => {
        const r = mod.routes.find((x) => x.id === routeInfo.query.tour)
        const step = Math.max(1, Number(routeInfo.query.step) || 1)
        if (r) tour.loadAt(r, step - 1)
      })
      .catch(() => {})
  }

  // 播放中用户拖拽地球 → 自动暂停,把控制权还给用户
  watch(canvas, (val) => {
    val?.getControls?.()?.addEventListener('start', () => {
      if (tour.status.value === 'playing') tour.pause()
    })
  }, { once: true })

  return { tour, tourRoutes, tourUIVisible, openTourPicker, handleTourPick, handleTourClose }
}
