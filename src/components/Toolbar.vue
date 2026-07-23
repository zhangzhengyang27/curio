<template>
  <div class="toolbar">
    <button
      v-for="tool in tools"
      :key="tool.key"
      class="tool-btn"
      :class="{ active: tool.active }"
      :title="tool.title"
      @click="tool.action"
    >
      <span class="tool-icon" v-html="tool.icon" />
      <span class="tool-tooltip">{{ tool.title }}</span>
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
  onRealisticEarthToggle: Function
})

const earthStore = useEarthStore()
const cloudActive = ref(false)
const nightActive = ref(false)
const terrainActive = ref(false)
const recording = ref(false)
const bloomActive = ref(false)
const realisticActive = ref(true)

const icons = {
  screenshot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  rotate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/><path d="M17.5 14c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/><path d="M17.5 9c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/></svg>`,
  night: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  storm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="m19 5 2 2-2 2"/><path d="M13 11l-4 6h6l-4 6"/></svg>`,
  terrain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 20 6-12 4 8 4-6 4 10H3z"/></svg>`,
  split: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>`,
  record: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  bloom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
  realistic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
}

function toggleRotation() {
  earthStore.isRotating = !earthStore.isRotating
}

function handleCloudToggle() {
  cloudActive.value = props.onCloudToggle?.() ?? cloudActive.value
}

function handleNightToggle() {
  nightActive.value = props.onNightToggle?.() ?? nightActive.value
}

function handleTerrainToggle() {
  terrainActive.value = props.onTerrainToggle?.() ?? terrainActive.value
}

function handleRecordGif() {
  recording.value = !recording.value
  props.onRecordGif?.()
}

function handleBloomToggle() {
  bloomActive.value = props.onBloomToggle?.() ?? bloomActive.value
}

function handleRealisticEarthToggle() {
  realisticActive.value = props.onRealisticEarthToggle?.() ?? realisticActive.value
}

const tools = [
  { key: 'screenshot', title: '截图', icon: icons.screenshot, action: () => props.onScreenshot?.() },
  { key: 'rotate', title: '自动旋转', icon: icons.rotate, action: toggleRotation, active: earthStore.isRotating },
  { key: 'cloud', title: '云层', icon: icons.cloud, action: handleCloudToggle, active: cloudActive.value },
  { key: 'night', title: '夜间模式', icon: icons.night, action: handleNightToggle, active: nightActive.value },
  { key: 'storm', title: '风暴', icon: icons.storm, action: () => props.onStorm?.() },
  { key: 'terrain', title: '地形', icon: icons.terrain, action: handleTerrainToggle, active: terrainActive.value },
  { key: 'split', title: '分屏对比', icon: icons.split, action: () => props.onSplitScreen?.() },
  { key: 'record', title: recording.value ? '停止录制' : '录制 GIF', icon: icons.record, action: handleRecordGif, active: recording.value },
  { key: 'bloom', title: '辉光', icon: icons.bloom, action: handleBloomToggle, active: bloomActive.value },
  { key: 'realistic', title: '真实地球', icon: icons.realistic, action: handleRealisticEarthToggle, active: realisticActive.value }
]
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tv-xs);
}

.tool-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background: var(--tv-primary-fixed);
  color: var(--tv-primary);
}

.tool-btn.active {
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
}

.tool-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.tool-tooltip {
  position: absolute;
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--tv-inverse-surface);
  color: var(--tv-inverse-on-surface);
  padding: 4px 10px;
  border-radius: var(--tv-radius-md);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-btn:hover .tool-tooltip {
  opacity: 1;
}
</style>
