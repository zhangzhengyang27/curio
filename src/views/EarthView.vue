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
    <SearchBox
      class="search-box"
      @select="onSearchSelect"
    />
    <InfoPanel />
    <ContextMenu :on-fly-to="handleFlyTo" />
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
    <LayerPanel
      :layers="layerList"
      :on-toggle="handleLayerToggle"
      :on-opacity="handleLayerOpacity"
    />
    <ComparePanel />
    <TimelineSlider />
    <LegendBar />
    <LoadingOverlay ref="loadingRef" />
    <div class="visualization-bar">
      <button
        v-for="mode in vizModes"
        :key="mode.key"
        :class="['viz-btn', { active: earthStore.currentVisualization === mode.key }]"
        @click="mode.key === 'import' ? openFileImport() : switchViz(mode.key)"
      >
        {{ mode.label }}
      </button>
    </div>
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
  { key: 'gdp', label: 'GDP' },
  { key: 'population', label: '人口' },
  { key: 'carbon', label: '碳排放' },
  { key: 'trade', label: '贸易' },
  { key: 'flights', label: '航班' },
  { key: 'earthquake', label: '地震' },
  { key: 'nightlights', label: '灯光' },
  { key: 'china', label: '中国' },
  { key: 'landmarks', label: '地标' },
  { key: 'heatmap', label: '热力' },
  { key: 'import', label: '导入' },
  { key: 'default', label: '默认' }
]

function switchViz(mode) {
  earthCanvasRef.value?.switchVisualization(mode)
}

// 图层数据
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

// ===== 键盘快捷键 =====
function handleKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
  switch (e.key.toLowerCase()) {
    case ' ': e.preventDefault(); earthStore.isRotating = !earthStore.isRotating; break
    case 's': handleScreenshot(); break
    case 'c': earthStore.compareCountries = []; break
    case 'r': earthCanvasRef.value?.flyTo(0, 20); break // 重置视角
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
  // Download frames as individual images (simplified GIF)
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

// URL hash 分享
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
  width: 100vw;
  height: 100vh;
  position: relative;
}
.search-box {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
.visualization-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  background: rgba(20, 20, 40, 0.9);
  padding: 8px 14px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
  z-index: 100;
  max-width: 95vw;
}
.viz-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  padding: 5px 12px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}
.viz-btn:hover {
  border-color: rgba(0, 204, 204, 0.5);
}
.viz-btn.active {
  background: rgba(0, 204, 204, 0.3);
  border-color: #00cccc;
  color: #fff;
}
</style>
