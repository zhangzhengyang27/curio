<template>
  <CompareView
    v-if="splitMode"
    @back="splitMode = false"
  />
  <div
    v-else
    class="earth-view"
  >
    <EarthCanvas ref="earthCanvasRef" />

    <!-- Floating Centered Search -->
    <div class="search-wrapper">
      <SearchBox @select="onSearchSelect" />
    </div>

    <!-- Left Side Panel - Layers -->
    <aside class="left-panel tv-glass-panel">
      <LayerPanel
        :layers="layerList"
        :on-toggle="handleLayerToggle"
        :on-opacity="handleLayerOpacity"
      />
    </aside>

    <!-- Right Info Panel（按需渲染：未选中任何地点时不留空壳面板） -->
    <aside
      v-if="interactionStore.showInfoPanel"
      class="right-panel tv-glass-panel"
    >
      <InfoPanel />
    </aside>

    <!-- Right Floating Toolbar -->
    <aside
      class="tools-panel tv-glass-panel"
      :class="{ 'with-info': interactionStore.showInfoPanel }"
    >
      <Toolbar
        :on-screenshot="handleScreenshot"
        :on-cloud-toggle="handleCloudToggle"
        :on-night-toggle="handleNightToggle"
        :on-storm="handleStorm"
        :on-terrain-toggle="handleTerrainToggle"
        :on-split-screen="handleSplitScreen"
        :on-record-gif="handleRecordGif"
        :on-bloom-toggle="handleBloomToggle"
        :on-realistic-earth-toggle="handleRealisticEarthToggle"
        :on-tour="openTourPicker"
      />
    </aside>

    <!-- 巡游播放时隐藏模式切换条与时间轴：既聚焦叙事，也避免与播放条抢底部空间 -->
    <div
      v-if="!tourUIVisible"
      class="bottom-bar tv-glass-panel"
    >
      <button
        v-for="mode in vizModes"
        :key="mode.key"
        :class="['viz-btn', { active: earthStore.currentVisualization === mode.key, loading: earthStore.vizLoading === mode.key }]"
        @click="mode.key === 'import' ? openFileImport() : switchViz(mode.key)"
      >
        <span
          v-if="earthStore.vizLoading === mode.key"
          class="viz-icon viz-spinner"
          aria-label="加载中"
        />
        <UiIcon
          v-else-if="mode.icon"
          class="viz-icon"
          :name="mode.icon"
          :size="15"
        />
        <span>{{ mode.label }}</span>
      </button>
    </div>

    <!-- 异步图层加载提示：非阻塞；巡游模式下底栏隐藏，此 chip 仍可见 -->
    <Transition name="fade">
      <div
        v-if="earthStore.vizLoading"
        class="viz-loading tv-glass-panel"
        data-testid="viz-loading"
      >
        <span class="viz-loading-spinner" />
        <span>正在加载「{{ vizLoadingLabel }}」数据…</span>
      </div>
    </Transition>

    <ComparePanel />
    <TimelineSlider v-if="!tourUIVisible" />
    <LegendBar />
    <ContextMenu :on-fly-to="handleFlyTo" />
    <TourOverlay
      v-if="tourUIVisible"
      :tour="tour"
      :routes="tourRoutes ?? []"
      @pick="handleTourPick"
      @close="handleTourClose"
    />

    <input
      ref="fileInput"
      type="file"
      accept=".csv,.json"
      style="display:none"
      @change="handleFileImport"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, defineAsyncComponent, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EarthCanvas from '../components/EarthCanvas.vue'
import SearchBox from '../components/SearchBox.vue'
import InfoPanel from '../components/InfoPanel.vue'
import ContextMenu from '../components/ContextMenu.vue'
import ComparePanel from '../components/ComparePanel.vue'
import Toolbar from '../components/Toolbar.vue'
import LayerPanel from '../components/LayerPanel.vue'
import TimelineSlider from '../components/TimelineSlider.vue'
import LegendBar from '../components/LegendBar.vue'
import CompareView from './CompareView.vue'
import { useTourEngine } from '../composables/useTourEngine'
import { useEarthStore } from '../stores/useEarthStore'
import { useLayerStore } from '../stores/useLayerStore'
import { useTimelineStore } from '../stores/useTimelineStore'
import type { TourRouteWithDuration } from '../three/tours/routes'
import UiIcon, { type UiIconName } from '../components/UiIcon'
import { useInteractionStore } from '../stores/useInteractionStore'

const earthStore = useEarthStore()
const layerStore = useLayerStore()
const timelineStore = useTimelineStore()
const interactionStore = useInteractionStore()
const earthCanvasRef = ref<InstanceType<typeof EarthCanvas> | null>(null)
const splitMode = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const vizModes: Array<{ key: string; label: string; icon?: UiIconName }> = [
  { key: 'gdp', label: 'GDP', icon: 'banknote' },
  { key: 'population', label: '人口', icon: 'users' },
  { key: 'carbon', label: '碳排放', icon: 'factory' },
  { key: 'trade', label: '贸易', icon: 'trade' },
  { key: 'flights', label: '航班', icon: 'plane' },
  { key: 'earthquake', label: '地震', icon: 'activity' },
  { key: 'nightlights', label: '夜间灯光', icon: 'bulb' },
  { key: 'china', label: '中国', icon: 'flag' },
  { key: 'landmarks', label: '地标', icon: 'pin' },
  { key: 'heatmap', label: '热力图', icon: 'flame' },
  { key: 'import', label: '导入数据', icon: 'download' },
  { key: 'default', label: '默认', icon: 'globe' }
]

const vizLoadingLabel = computed(() => vizModes.find(m => m.key === earthStore.vizLoading)?.label ?? earthStore.vizLoading)

function switchViz(mode: string) {
  earthCanvasRef.value?.switchVisualization(mode)
}

const layerList = computed(() => layerStore.layers)

function onSearchSelect(item: { lon: number; lat: number; name: string; flag: string }) {
  if (item.lon !== undefined && item.lat !== undefined) {
    earthCanvasRef.value?.flyTo(item.lon, item.lat)
  }
}

function handleFlyTo(lon: number, lat: number) {
  if (lon !== undefined && lat !== undefined) {
    earthCanvasRef.value?.flyTo(lon, lat)
  }
}

function handleScreenshot() {
  const renderer = earthCanvasRef.value?.getRenderer()
  if (!renderer) return
  const dataURL = renderer.domElement.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = 'earth-screenshot.png'
  link.href = dataURL
  link.click()
}

function handleLayerToggle(id: string, visible: boolean) {
  layerStore.setVisible(id, visible)
}

function handleLayerOpacity(id: string, opacity: number) {
  layerStore.setOpacity(id, opacity)
}

function handleCloudToggle() {
  return earthCanvasRef.value?.toggleCloud()
}

function handleNightToggle() {
  return earthCanvasRef.value?.toggleNightMode()
}

function handleStorm() {
  earthCanvasRef.value?.createStorm()
}

function handleTerrainToggle() {
  return earthCanvasRef.value?.toggleTerrain()
}

function handleSplitScreen() {
  splitMode.value = true
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return
  // 巡游界面打开期间全局快捷键整体让位（空格/相机类按键归播放器管，
  // 且 document 先于 window 收到事件，播放器侧 preventDefault 拦不住这里）
  if (tourUIVisible.value) return
  switch (e.key.toLowerCase()) {
    case ' ': e.preventDefault(); earthStore.isRotating = !earthStore.isRotating; break
    case 's': handleScreenshot(); break
    case 'c': earthStore.compareCountries = []; break
    case 'r': earthCanvasRef.value?.flyTo(0, 20); break
    case 'n': handleNightToggle(); break
    case 'f': {
      const sel = earthStore.selectedCountry
      const idx = sel ? earthStore.searchIndex[sel] : undefined
      if (idx) earthCanvasRef.value?.flyTo(idx.lon, idx.lat)
      break
    }
  }
}
onMounted(() => { document.addEventListener('keydown', handleKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', handleKeydown) })

let gifRecording = false
let gifFrames: string[] = []
let gifInterval: ReturnType<typeof setInterval> | null = null
function handleRecordGif() {
  gifRecording = !gifRecording
  if (gifRecording) {
    gifFrames = []
    gifInterval = setInterval(() => {
      const renderer = earthCanvasRef.value?.getRenderer()
      if (!renderer) return
      gifFrames.push(renderer.domElement.toDataURL('image/jpeg', 0.5))
      if (gifFrames.length > 60) { gifFrames.shift() }
    }, 200)
  } else {
    clearInterval(gifInterval!)
    if (gifFrames.length > 0) {
      downloadFrames()
    }
  }
}

function downloadFrames() {
  gifFrames.forEach((frame, i) => {
    setTimeout(() => {
      const link = document.createElement('a')
      link.download = `frame-${String(i).padStart(3, '0')}.jpg`
      link.href = frame
      link.click()
    }, i * 50)
  })
  gifFrames = []
}

onUnmounted(() => {
  if (gifRecording) {
    gifRecording = false
    clearInterval(gifInterval!)
    gifFrames = []
  }
  timelineStore.pause()
})

function openFileImport() {
  fileInput.value?.click()
}

async function handleFileImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    let data
    if (file.name.endsWith('.csv')) data = parseCSV(text)
    else data = JSON.parse(text)
    if (!Array.isArray(data)) data = [data]
    const sample = data[0]
    const lonKey = Object.keys(sample).find(k => /lon|lng|经度|longitude/i.test(k))
    const latKey = Object.keys(sample).find(k => /lat|纬度|latitude/i.test(k))
    if (!lonKey || !latKey) { alert('未找到经纬度列，请确保数据包含 lon/lat 或 经度/纬度 列'); return }
    const points = data.map(d => ({ lon: parseFloat(d[lonKey]), lat: parseFloat(d[latKey]) })).filter(p => !isNaN(p.lon) && !isNaN(p.lat))
    if (!points.length) { alert('无有效数据点'); return }
    earthCanvasRef.value?.loadCustomScatter(points)
    alert(`已导入 ${points.length} 个数据点`)
  } catch (err) { console.error(err); alert('文件解析失败: ' + (err instanceof Error ? err.message : String(err))) }
  ;(e.target as HTMLInputElement).value = ''
}

function parseCSV(text: string) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^\"|\"$/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => obj[h] = vals[i])
    return obj
  })
}

function handleBloomToggle() {
  return earthCanvasRef.value?.toggleBloom()
}

function handleRealisticEarthToggle() {
  return earthCanvasRef.value?.toggleRealisticEarth()
}

// === 数据巡游（分镜稿与路线数据见 docs/TOUR_ROUTES.md） ===
const TourOverlay = defineAsyncComponent(() => import('../components/TourOverlay.vue'))
const routeInfo = useRoute()
const router = useRouter()

// ?tour-dwell=<ms>：测试注入的自动前进停留时长（同 ?nostream 惯例），
// 拉长首步定时器让「暂停后手动步进」类断言不与自动前进竞速；不传=分镜自带节奏
const tourDwellOverride = (() => {
  const v = Number(new URLSearchParams(window.location.search).get('tour-dwell'))
  return Number.isFinite(v) && v > 0 ? v : undefined
})()
const tour = useTourEngine({
  switchMode: (mode: string) => earthCanvasRef.value?.switchVisualization(mode),
  flyTo: (lon: number, lat: number, duration?: number) => earthCanvasRef.value?.flyTo(lon, lat, duration),
  dwellOverrideMs: tourDwellOverride
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

// 播放开始时暂停自转并记住现场；退出/播完时还原可视化模式与自转
let tourSavedViz: string | null = null
let tourSavedRotate: boolean | null = null
watch(tour.status, (s) => {
  if (s !== 'idle' && tourSavedViz === null) {
    tourSavedViz = earthStore.currentVisualization
    tourSavedRotate = earthStore.isRotating
    earthStore.isRotating = false
  }
  if (s === 'idle' && tourSavedViz !== null) {
    earthStore.isRotating = tourSavedRotate!
    if (tourSavedViz !== earthStore.currentVisualization) earthCanvasRef.value?.switchVisualization(tourSavedViz)
    tourSavedViz = null
  }
})

// URL 状态：?tour=<id>&step=<n>（step 为 1-based），可刷新续播、可分享
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

// 分享链接直达：定位到指定步骤但不自动播放
if (routeInfo.query.tour) {
  import('../three/tours/routes')
    .then((mod) => {
      const r = mod.routes.find((x) => x.id === routeInfo.query.tour)
      const step = Math.max(1, Number(routeInfo.query.step) || 1)
      if (r) tour.loadAt(r, step - 1)
    })
    .catch(() => {})
}

// 播放中用户拖拽地球 → 自动暂停，把控制权还给用户
watch(earthCanvasRef, (val) => {
  val?.getControls?.()?.addEventListener('start', () => {
    if (tour.status.value === 'playing') tour.pause()
  })
}, { once: true })

if (typeof window !== 'undefined') {
  const hash = window.location.hash.replace('#', '')
  if (hash && ['gdp','population','carbon','trade','flights','earthquake','nightlights','china','landmarks','heatmap'].includes(hash)) {
    const stopReady = watch(() => earthCanvasRef.value, (val) => {
      if (val) {
        val.switchVisualization(hash)
        stopReady()
      }
    }, { immediate: true })
  }
}
watch(() => earthStore.currentVisualization, (v) => {
  // 巡游播放中地址状态由 ?tour=&step= 统一管理；此时写 hash 会触发
  // vue-router 携带旧 query 的导航，把刚 replace 的 step 冲回去（竞态）
  if (tour.status.value !== 'idle') return
  if (v && v !== 'gdp') window.location.hash = '#' + v
})
</script>

<style scoped>
.earth-view {
  position: fixed;
  top: var(--tv-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: calc(100vh - var(--tv-top-nav-height));
  overflow: hidden;
}

.search-wrapper {
  position: absolute;
  top: var(--tv-margin);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: 100%;
  max-width: 480px;
  padding: 0 var(--tv-gutter);
  pointer-events: none;
}

.search-wrapper > * {
  pointer-events: auto;
}

.left-panel {
  position: absolute;
  left: var(--tv-margin);
  top: var(--tv-margin);
  bottom: var(--tv-margin);
  width: var(--tv-panel-width);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel {
  position: absolute;
  right: var(--tv-margin);
  top: var(--tv-margin);
  bottom: var(--tv-margin);
  width: var(--tv-info-panel-width);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tools-panel {
  position: absolute;
  right: calc(var(--tv-margin) + var(--tv-info-panel-width) + var(--tv-md));
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--tv-md) var(--tv-sm);
  border-radius: var(--tv-radius-full);
  gap: var(--tv-sm);
  transition: right var(--tv-dur) var(--tv-ease);
}

/* 信息面板收起时，工具条回到右缘 */
.tools-panel:not(.with-info) {
  right: var(--tv-margin);
}

.bottom-bar {
  position: absolute;
  bottom: var(--tv-margin);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--tv-xs);
  padding: var(--tv-sm) var(--tv-md);
  border-radius: var(--tv-radius-full);
  max-width: calc(100% - var(--tv-panel-width) - var(--tv-info-panel-width) - var(--tv-margin) * 4);
  overflow-x: auto;
}

.viz-btn {
  display: flex;
  align-items: center;
  gap: var(--tv-xs);
  padding: var(--tv-xs) var(--tv-md);
  border-radius: var(--tv-radius-full);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.viz-btn:hover {
  color: var(--tv-primary);
  background: var(--tv-surface-container);
}

.viz-btn.active {
  background: var(--tv-primary);
  color: var(--tv-on-primary);
}

.viz-icon {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

@media (max-width: 1200px) {
  .right-panel {
    width: 280px;
  }
  .tools-panel.with-info {
    right: calc(var(--tv-margin) + 280px + var(--tv-md));
  }
}

@media (max-width: 992px) {
  .right-panel,
  .tools-panel {
    display: none;
  }
  .left-panel {
    width: 220px;
  }
  .bottom-bar {
    max-width: calc(100% - 220px - var(--tv-margin) * 3);
  }
}

@media (max-width: 768px) {
  .left-panel {
    display: none;
  }
  .bottom-bar {
    max-width: calc(100% - var(--tv-margin) * 2);
  }
}

/* 异步图层加载提示 */
.viz-loading {
  position: absolute;
  left: 50%;
  bottom: 84px;
  transform: translateX(-50%);
  z-index: 55;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: var(--tv-radius-full, 999px);
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
}

.viz-loading-spinner,
.viz-spinner {
  display: inline-block;
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-top-color: var(--tv-primary, #4f8ef7);
  border-radius: 50%;
  animation: viz-spin 0.8s linear infinite;
}

.viz-loading-spinner {
  width: 16px;
  height: 16px;
}

.viz-spinner {
  width: 14px;
  height: 14px;
}

@keyframes viz-spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
