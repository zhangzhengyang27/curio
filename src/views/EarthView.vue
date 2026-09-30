<template>
  <CompareView
    v-if="splitMode"
    @back="splitMode = false"
  />
  <div
    v-else
    class="earth-view"
    :class="{ 'panel-entered': panelsSettled }"
  >
    <EarthCanvas ref="earthCanvasRef" />

    <!-- Floating Centered Search -->
    <div class="search-wrapper">
      <SearchBox @select="onSearchSelect" />
    </div>

    <!-- Left Side Panel - Layers -->
    <GlassPanel
      as="aside"
      class="left-panel"
    >
      <LayerPanel
        :layers="layerList"
        :on-toggle="handleLayerToggle"
        :on-opacity="handleLayerOpacity"
      />
    </GlassPanel>

    <!-- Right Info Panel（按需渲染：未选中任何地点时不留空壳面板） -->
    <GlassPanel
      v-if="interactionStore.showInfoPanel"
      as="aside"
      class="right-panel"
    >
      <InfoPanel />
    </GlassPanel>

    <!-- Right Floating Toolbar -->
    <GlassPanel
      as="aside"
      class="tools-panel"
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
    </GlassPanel>

    <!-- 巡游播放时隐藏模式切换条与时间轴：既聚焦叙事，也避免与播放条抢底部空间 -->
    <GlassPanel
      v-if="!tourUIVisible"
      as="div"
      class="bottom-bar"
    >
      <VizModeBar
        :modes="vizModes"
        :current="earthStore.currentVisualization"
        :loading="earthStore.vizLoading ?? undefined"
        @switch="switchViz"
        @import="openFileImport"
      />
    </GlassPanel>

    <!-- 异步图层加载提示：非阻塞；巡游模式下底栏隐藏，此 chip 仍可见 -->
    <Transition name="fade">
      <GlassPanel
        v-if="earthStore.vizLoading"
        as="div"
        class="viz-loading"
        data-testid="viz-loading"
      >
        <span class="viz-loading-spinner" />
        <span>正在加载「{{ vizLoadingLabel }}」数据…</span>
      </GlassPanel>
    </Transition>

    <!-- 图层数据加载失败：必须给可重试入口，否则按钮亮着、画面空、用户无从下手 -->
    <Transition name="fade">
      <GlassPanel
        v-if="earthStore.vizError"
        as="div"
        class="viz-loading viz-error"
        data-testid="viz-error"
      >
        <span>「{{ vizErrorLabel }}」数据加载失败</span>
        <button
          class="viz-error-retry"
          @click="retryViz"
        >
          重试
        </button>
      </GlassPanel>
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

    <CommandPalette
      ref="commandPaletteRef"
      :groups="paletteGroups"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import EarthCanvas from '../components/EarthCanvas.vue'
import SearchBox from '../components/SearchBox.vue'
import InfoPanel from '../components/InfoPanel.vue'
import ContextMenu from '../components/ContextMenu.vue'
import ComparePanel from '../components/ComparePanel.vue'
import Toolbar from '../components/Toolbar.vue'
import LayerPanel from '../components/LayerPanel.vue'
import TimelineSlider from '../components/TimelineSlider.vue'
import LegendBar from '../components/LegendBar.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import VizModeBar from '../components/VizModeBar.vue'
import { VIZ_MODES as vizModes } from '../components/vizModes'
import { useGifRecorder } from '../composables/useGifRecorder'
import { useTourSession } from '../composables/useTourSession'
import { useEarthUrlSync } from '../composables/useEarthUrlSync'
import { usePaletteGroups } from '../composables/usePaletteGroups'
import CompareView from './CompareView.vue'
import { useEarthStore } from '../stores/useEarthStore'
import { useLayerStore } from '../stores/useLayerStore'
import { useTimelineStore } from '../stores/useTimelineStore'
import { useInteractionStore } from '../stores/useInteractionStore'
import CommandPalette from '../components/CommandPalette.vue'

const earthStore = useEarthStore()
const layerStore = useLayerStore()
const timelineStore = useTimelineStore()
const interactionStore = useInteractionStore()
const earthCanvasRef = ref<InstanceType<typeof EarthCanvas> | null>(null)
const splitMode = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
// 进场动画只做首挂载:落定后给根挂 panel-entered,信息面板开合/巡游底栏
// 复插时不再重放 460ms 进场(终审 Minor #6)
const panelsSettled = ref(false)
onMounted(() => {
  const t = setTimeout(() => { panelsSettled.value = true }, 700)
  onUnmounted(() => clearTimeout(t))
})

// ── 命令面板(仅首页挂载,spec 决策点 2)──
const commandPaletteRef = ref<InstanceType<typeof CommandPalette> | null>(null)

const layerList = computed(() => layerStore.layers)

const TourOverlay = defineAsyncComponent(() => import('../components/TourOverlay.vue'))

const { tour, tourRoutes, tourUIVisible, openTourPicker, handleTourPick, handleTourClose } = useTourSession({
  canvas: earthCanvasRef,
  currentVisualization: () => earthStore.currentVisualization,
  isRotating: () => earthStore.isRotating,
  setRotating: (v) => { earthStore.isRotating = v },
  restoreViz: (mode) => earthCanvasRef.value?.switchVisualization(mode),
})

const paletteGroups = usePaletteGroups({
  searchIndex: () => earthStore.searchIndex,
  layers: layerList,
  canvas: earthCanvasRef,
  handlers: {
    layerToggle: handleLayerToggle,
    toggleRotate: () => { earthStore.isRotating = !earthStore.isRotating },
    screenshot: handleScreenshot,
    nightToggle: handleNightToggle,
    cloudToggle: handleCloudToggle,
    storm: handleStorm,
    splitScreen: handleSplitScreen,
    tour: openTourPicker,
  },
})

const vizLoadingLabel = computed(() => vizModes.find(m => m.key === earthStore.vizLoading)?.label ?? earthStore.vizLoading)
const vizErrorLabel = computed(() => vizModes.find(m => m.key === earthStore.vizError)?.label ?? earthStore.vizError)

function retryViz() {
  const mode = earthStore.vizError
  if (mode) earthCanvasRef.value?.switchVisualization(mode)
}

function switchViz(mode: string) {
  earthCanvasRef.value?.switchVisualization(mode)
}

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
  // ⌘K/Ctrl+K 在输入框聚焦时也必须可用(命令面板的标准唤醒方式),
  // 所以放在 INPUT/SELECT 守卫之前;但巡游期间仍要让位——palette 压在
  // 播放器之上,还能触发分屏等打断巡游状态机的命令(终审 Important #1)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    if (tourUIVisible.value) return
    e.preventDefault()
    commandPaletteRef.value?.open()
    return
  }
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return
  // 巡游界面打开期间全局快捷键整体让位（空格/相机类按键归播放器管，
  // 且 document 先于 window 收到事件，播放器侧 preventDefault 拦不住这里）
  if (tourUIVisible.value) return
  switch (e.key.toLowerCase()) {
    case ' ': e.preventDefault(); earthStore.isRotating = !earthStore.isRotating; break
    case '/': e.preventDefault(); commandPaletteRef.value?.open(); break
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
// 拆分回归修复(M4 终审 Critical#1):GDP 年表播放中离开首页必须停掉,
// 否则 store 里的链式 setTimeout 每秒空转,回到 / 时时间轴还在自动播放
onUnmounted(() => { timelineStore.pause() })

// 「录制 GIF」：抓帧 → 统一尺寸 → 单文件 GIF。
// 旧实现把 ≤60 张 JPEG 帧以 50ms 间隔逐个 link.click() 倒进下载目录，
// 且因为直接 toDataURL()（renderer 未开 preserveDrawingBuffer）每帧都是纯黑。
const { toggle: handleRecordGif } = useGifRecorder(
  width => earthCanvasRef.value?.captureFrameScaled(width),
)

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

useEarthUrlSync({
  currentVisualization: computed(() => earthStore.currentVisualization),
  canvas: earthCanvasRef,
  tourActive: () => tour.status.value !== 'idle',
})
</script>

<style>
@import '../styles/earth-view.css';
</style>
