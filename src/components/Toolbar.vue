<template>
  <div class="toolbar">
    <button
      class="tool-btn"
      title="截图保存"
      @click="handleScreenshot"
    >
      📷
    </button>
    <button
      class="tool-btn"
      :class="{ active: earthStore.isRotating }"
      title="旋转/暂停"
      @click="toggleRotation"
    >
      {{ earthStore.isRotating ? '⏸' : '▶️' }}
    </button>
    <button
      class="tool-btn"
      :class="{ active: cloudActive }"
      title="云层开关"
      @click="handleCloudToggle"
    >
      ☁️
    </button>
    <button
      class="tool-btn"
      :class="{ active: nightActive }"
      title="日夜切换"
      @click="handleNightToggle"
    >
      🌙
    </button>
    <button
      class="tool-btn"
      title="台风粒子"
      @click="handleStorm"
    >
      🌀
    </button>
    <button
      class="tool-btn"
      :class="{ active: terrainActive }"
      title="3D地形"
      @click="handleTerrainToggle"
    >
      ⛰️
    </button>
    <button
      class="tool-btn"
      title="分屏对比"
      @click="handleSplitScreen"
    >
      ◫
    </button>
    <button
      class="tool-btn"
      title="录制GIF"
      @click="handleRecordGif"
    >
      {{ recording ? '⏹' : '🎥' }}
    </button>
    <button
      class="tool-btn"
      :class="{ active: bloomActive }"
      title="辉光效果"
      @click="handleBloomToggle"
    >
      ✨
    </button>
    <button
      class="tool-btn"
      :class="{ active: realisticActive }"
      title="真实/笔画地球切换"
      @click="handleRealisticEarthToggle"
    >
      🌍
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEarthStore } from '../stores/useEarthStore.js'

const props = defineProps({
  onScreenshot: Function,
  onCloudToggle: Function,
  onNightToggle: Function,
  onStorm: Function,
  onTerrainToggle: Function,
  onSplitScreen: Function,
  onRecordGif: Function,
  onBloomToggle: Function,
  onRealisticEarthToggle: Function,
})

const earthStore = useEarthStore()
const cloudActive = ref(false)
const nightActive = ref(false)
const terrainActive = ref(false)
const recording = ref(false)
const bloomActive = ref(false)
const realisticActive = ref(true)

function handleScreenshot() { props.onScreenshot?.() }
function toggleRotation() { earthStore.isRotating = !earthStore.isRotating }
function handleCloudToggle() { cloudActive.value = props.onCloudToggle?.() ?? cloudActive.value }
function handleNightToggle() { nightActive.value = props.onNightToggle?.() ?? nightActive.value }
function handleStorm() { props.onStorm?.() }
function handleTerrainToggle() { terrainActive.value = props.onTerrainToggle?.() ?? terrainActive.value }
function handleSplitScreen() { props.onSplitScreen?.() }
function handleRecordGif() { recording.value = !recording.value; props.onRecordGif?.() }
function handleBloomToggle() { bloomActive.value = props.onBloomToggle?.() ?? bloomActive.value }
function handleRealisticEarthToggle() { realisticActive.value = props.onRealisticEarthToggle?.() ?? realisticActive.value }
</script>

<style scoped>
.toolbar {
  position: fixed; bottom: 80px; right: 20px;
  display: flex; flex-direction: column; gap: 8px; z-index: 100;
}
.tool-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(20, 20, 40, 0.85);
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px); transition: all 0.2s;
}
.tool-btn:hover {
  border-color: rgba(0, 204, 204, 0.4); background: rgba(0, 204, 204, 0.1);
}
.tool-btn::after {
  content: attr(title);
  position: absolute; right: 52px;
  background: rgba(0,0,0,0.8); color: #ccc;
  padding: 3px 10px; border-radius: 6px;
  font-size: 12px; white-space: nowrap;
  opacity: 0; pointer-events: none;
  transition: opacity 0.15s;
}
.tool-btn:hover::after { opacity: 1; }
.tool-btn.active { border-color: #00cccc; }
</style>
