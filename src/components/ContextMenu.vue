<template>
  <div
    v-if="interactionStore.showContextMenu"
    class="context-menu"
    :style="{ left: interactionStore.contextMenuPos.x + 'px', top: interactionStore.contextMenuPos.y + 'px' }"
    @click.stop
  >
    <div class="menu-header">
      {{ contextName }}
    </div>
    <div class="menu-divider" />
    <div
      class="menu-item"
      @click="onShowDetail"
    >
      📋 查看详情
    </div>
    <div
      class="menu-item"
      @click="handleFlyTo"
    >
      ✈️ 飞到这里
    </div>
    <div
      class="menu-item"
      @click="onToggleCompare"
    >
      {{ isCompared ? '➖ 取消对比' : '➕ 加入对比' }}
    </div>
    <div class="menu-divider" />
    <div
      class="menu-item"
      @click="interactionStore.closeContextMenu"
    >
      取消
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useInteractionStore } from '../stores/useInteractionStore.js'
import { useEarthStore } from '../stores/useEarthStore.js'

const props = defineProps({
  onFlyTo: Function
})

const interactionStore = useInteractionStore()
const earthStore = useEarthStore()

const contextName = computed(() => interactionStore.contextMenuTarget?.name || '')

const isCompared = computed(() => {
  const target = interactionStore.contextMenuTarget
  return target && earthStore.compareCountries.includes(target.name)
})

function onShowDetail() {
  const target = interactionStore.contextMenuTarget
  if (target) {
    interactionStore.openInfoPanel({
      name: target.name,
      gdp: target.gdp ? (target.gdp / 1000000000000).toFixed(3) + ' 万亿美元' : '数据缺失',
      lon: target.lon,
      lat: target.lat
    })
  }
  interactionStore.closeContextMenu()
}

function handleFlyTo() {
  const target = interactionStore.contextMenuTarget
  if (target && props.onFlyTo) {
    props.onFlyTo(target.lon, target.lat)
  }
  interactionStore.closeContextMenu()
}

function onToggleCompare() {
  if (interactionStore.contextMenuTarget?.name) {
    earthStore.toggleCompare(interactionStore.contextMenuTarget.name)
  }
  interactionStore.closeContextMenu()
}

// 点击空白关闭
if (typeof window !== 'undefined' && !window._ctxMenuListeners) {
  window._ctxMenuListeners = true
  window.addEventListener('click', () => interactionStore.closeContextMenu())
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: rgba(20, 20, 40, 0.95);
  border-radius: 10px;
  padding: 6px 0;
  min-width: 160px;
  z-index: 200;
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.08);
}
.menu-header {
  padding: 6px 16px;
  color: #00cccc;
  font-size: 14px;
  font-weight: 600;
}
.menu-item {
  padding: 9px 16px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.menu-item:hover {
  background: rgba(0, 204, 204, 0.15);
  color: #fff;
}
.menu-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 4px 0;
}
</style>
