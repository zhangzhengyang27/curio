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

    <!-- 图层数据加载失败：必须给可重试入口，否则按钮亮着、画面空、用户无从下手 -->
    <Transition name="fade">
      <div
        v-if="earthStore.vizError"
        class="viz-loading viz-error tv-glass-panel"
        data-testid="viz-error"
      >
        <span>「{{ vizErrorLabel }}」数据加载失败</span>
        <button
          class="viz-error-retry"
          @click="retryViz"
        >
          重试
        </button>
      </div>
    </Transition>

    <ComparePanel />    <TimelineSlider v-if="!tourUIVisible" />
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
const vizErrorLabel = computed(() => vizModes.find(m => m.key === earthStore.vizError)?.label ?? earthStore.vizError)

function retryViz() {
  const mode = earthStore.vizError
  if (mode) earthCanvasRef.value?.switchVisualization(mode)
}

function switchViz(mode: string) {
  earthCanvasRef.value?.switchVisualization(mode)
}

const layerList = computed(() => layerStore.layers)

// 坐标有效性统一由 flyTo 自己把关（它是唯一会把相机写成 NaN 的地方）；
// 这里原先的 `!== undefined` 看着像守卫，其实挡不住 NaN。
function onSearchSelect(item: { lon: number; lat: number; name: string; flag: string }) {
  earthCanvasRef.value?.flyTo(item.lon, item.lat)
}

function handleFlyTo(lon: number, lat: number) {
  earthCanvasRef.value?.flyTo(lon, lat)
}

function handleScreenshot() {
  // 走 captureFrame 而不是直接 renderer.domElement.toDataURL()：
  // 后者在点击回调里调用只能拿到清屏后的纯黑图（renderer 未开 preserveDrawingBuffer）
  const dataURL = earthCanvasRef.value?.captureFrame()
  if (!dataURL) return
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

// 「录制 GIF」：抓帧 → 统一尺寸 → 单文件 GIF。
// 旧实现把 ≤60 张 JPEG 帧以 50ms 间隔逐个 link.click() 倒进下载目录，
// 且因为直接 toDataURL()（renderer 未开 preserveDrawingBuffer）每帧都是纯黑。
const GIF_MAX_FRAMES = 50
const GIF_FRAME_WIDTH = 400
const GIF_FRAME_INTERVAL_MS = 250

interface GifFrame {
  rgba: Uint8Array
  w: number
  h: number
}

let gifRecording = false
let gifFrames: GifFrame[] = []
let gifInterval: ReturnType<typeof setInterval> | null = null

function grabGifFrame() {
  const frame = earthCanvasRef.value?.captureFrameScaled(GIF_FRAME_WIDTH)
  if (!frame) return
  // 录制中途窗口 resize 会改变画布比例，帧尺寸不一致会让 GIF 解码错乱，与首帧不符的直接丢
  if (gifFrames.length && (gifFrames[0].w !== frame.w || gifFrames[0].h !== frame.h)) return
  gifFrames.push({ rgba: frame.data, w: frame.w, h: frame.h })
  if (gifFrames.length > GIF_MAX_FRAMES) gifFrames.shift()
}

async function encodeGif() {
  const frames = gifFrames
  gifFrames = []
  if (frames.length < 2) return
  try {
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
    const gif = GIFEncoder()
    // 用首帧建一份全局调色板给所有帧复用：逐帧各自量化会让帧间色板不同，动起来就是闪烁
    const palette = quantize(frames[0].rgba, 256, { format: 'rgb565' })
    for (const f of frames) {
      const index = applyPalette(f.rgba, palette, 'rgb565')
      gif.writeFrame(index, f.w, f.h, { palette, delay: GIF_FRAME_INTERVAL_MS })
    }
    gif.finish()
    // gifenc 返回 Uint8Array<ArrayBufferLike>，TS 5.7+ 不再直接视其为 BlobPart
    const url = URL.createObjectURL(new Blob([gif.bytes() as unknown as BlobPart], { type: 'image/gif' }))
    const link = document.createElement('a')
    link.download = `earth-${Date.now()}.gif`
    link.href = url
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (err) {
    console.error('GIF 编码失败:', err)
  }
}

function handleRecordGif() {
  gifRecording = !gifRecording
  if (gifRecording) {
    gifFrames = []
    gifInterval = setInterval(grabGifFrame, GIF_FRAME_INTERVAL_MS)
  } else {
    if (gifInterval) clearInterval(gifInterval)
    gifInterval = null
    void encodeGif()
  }
}

onUnmounted(() => {
  if (gifRecording) {
    gifRecording = false
    if (gifInterval) clearInterval(gifInterval)
    gifInterval = null
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
  // replaceState 而不是直写 location.hash：直写每次点模式都往历史里压一条，
  // 「后退」会在 12 个模式之间来回走而不是退出页面。
  // gdp 是默认值，切回它要把 hash 清掉 —— 否则 carbon → gdp 后地址还留着
  // #carbon，同一个链接再打开会落在别的模式上。
  const base = window.location.pathname + window.location.search
  if (v && v !== 'gdp') {
    window.history.replaceState(null, '', base + '#' + v)
  } else if (window.location.hash) {
    window.history.replaceState(null, '', base)
  }
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

.viz-error {
  pointer-events: auto;
  /* 加载提示是纯展示、被底栏压住无所谓；可重试的提示必须点得到，要盖过底栏（z 99/100） */
  z-index: 300;
  color: var(--tv-error);
}

.viz-error-retry {
  border: 1px solid var(--tv-error);
  border-radius: var(--tv-radius-full, 999px);
  background: transparent;
  color: var(--tv-error);
  padding: 2px 12px;
  font-size: 12px;
  cursor: pointer;
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
