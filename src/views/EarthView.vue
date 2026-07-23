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

    <!-- Right Info Panel -->
    <aside class="right-panel tv-glass-panel">
      <InfoPanel />
    </aside>

    <!-- Right Floating Toolbar -->
    <aside class="tools-panel tv-glass-panel">
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
      />
    </aside>

    <!-- Bottom Visualization Switcher -->
    <div class="bottom-bar tv-glass-panel">
      <button
        v-for="mode in vizModes"
        :key="mode.key"
        :class="['viz-btn', { active: earthStore.currentVisualization === mode.key }]"
        @click="mode.key === 'import' ? openFileImport() : switchViz(mode.key)"
      >
        <span
          v-if="mode.icon"
          class="viz-icon"
        >{{ mode.icon }}</span>
        <span>{{ mode.label }}</span>
      </button>
    </div>

    <ComparePanel />
    <TimelineSlider />
    <LegendBar />
    <LoadingOverlay ref="loadingRef" />
    <ContextMenu :on-fly-to="handleFlyTo" />

    <input
      ref="fileInput"
      type="file"
      accept=".csv,.json"
      style="display:none"
      @change="handleFileImport"
    >
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import EarthCanvas from '../components/EarthCanvas.vue'
import SearchBox from '../components/SearchBox.vue'
import InfoPanel from '../components/InfoPanel.vue'
import ContextMenu from '../components/ContextMenu.vue'
import ComparePanel from '../components/ComparePanel.vue'
import Toolbar from '../components/Toolbar.vue'
import LayerPanel from '../components/LayerPanel.vue'
import TimelineSlider from '../components/TimelineSlider.vue'
import LegendBar from '../components/LegendBar.vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'
import CompareView from './CompareView.vue'
import { useEarthStore } from '../stores/useEarthStore.js'
import { useLayerStore } from '../stores/useLayerStore.js'

const earthStore = useEarthStore()
const layerStore = useLayerStore()
const earthCanvasRef = ref(null)
const splitMode = ref(false)
const fileInput = ref(null)
const loadingRef = ref(null)

const vizModes = [
  { key: 'gdp', label: 'GDP', icon: '💰' },
  { key: 'population', label: '人口', icon: '👥' },
  { key: 'carbon', label: '碳排放', icon: '🏭' },
  { key: 'trade', label: '贸易', icon: '🚢' },
  { key: 'flights', label: '航班', icon: '✈️' },
  { key: 'earthquake', label: '地震', icon: '🌊' },
  { key: 'nightlights', label: '夜间灯光', icon: '💡' },
  { key: 'china', label: '中国', icon: '🇨🇳' },
  { key: 'landmarks', label: '地标', icon: '📍' },
  { key: 'heatmap', label: '热力图', icon: '🔥' },
  { key: 'import', label: '导入数据', icon: '📁' },
  { key: 'default', label: '默认', icon: '🌍' }
]

function switchViz(mode) {
  earthCanvasRef.value?.switchVisualization(mode)
}

const layerList = computed(() => layerStore.layers)

function onSearchSelect(item) {
  if (item.lon !== undefined && item.lat !== undefined) {
    earthCanvasRef.value?.flyTo(item.lon, item.lat)
  }
}

function handleFlyTo(lon, lat) {
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

function handleLayerToggle(id, visible) {
  layerStore.setVisible(id, visible)
}

function handleLayerOpacity(id, opacity) {
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

function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  switch (e.key.toLowerCase()) {
    case ' ': e.preventDefault(); earthStore.isRotating = !earthStore.isRotating; break
    case 's': handleScreenshot(); break
    case 'c': earthStore.compareCountries = []; break
    case 'r': earthCanvasRef.value?.flyTo(0, 20); break
    case 'n': handleNightToggle(); break
    case 'f': {
      const sel = earthStore.selectedCountry
      const idx = earthStore.searchIndex[sel]
      if (idx) earthCanvasRef.value?.flyTo(idx.lon, idx.lat)
      break
    }
  }
}
onMounted(() => { document.addEventListener('keydown', handleKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', handleKeydown) })

let gifRecording = false
let gifFrames = []
let gifInterval = null
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
    clearInterval(gifInterval)
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
    clearInterval(gifInterval)
    gifFrames = []
  }
})

function openFileImport() {
  fileInput.value?.click()
}

async function handleFileImport(e) {
  const file = e.target.files?.[0]
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
  } catch (err) { console.error(err); alert('文件解析失败: ' + err.message) }
  e.target.value = ''
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^\"|\"$/g, ''))
    const obj = {}
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

if (typeof window !== 'undefined') {
  const hash = window.location.hash.replace('#', '')
  if (hash && ['gdp','population','carbon','trade','flights','earthquake','nightlights','china','landmarks','heatmap'].includes(hash)) {
    setTimeout(() => earthCanvasRef.value?.switchVisualization(hash), 2000)
  }
}
watch(() => earthStore.currentVisualization, (v) => {
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
  font-size: 14px;
  line-height: 1;
}

@media (max-width: 1200px) {
  .right-panel {
    width: 280px;
  }
  .tools-panel {
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
</style>
