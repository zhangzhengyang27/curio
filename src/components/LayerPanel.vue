<template>
  <div class="layer-panel">
    <div class="panel-header">
      <div>
        <h2 class="panel-title">图层</h2>
        <p class="panel-subtitle">管理地球覆盖图层</p>
      </div>
    </div>

    <div class="layer-list custom-scrollbar">
      <div
        v-for="layer in layers"
        :key="layer.id"
        class="layer-group"
      >
        <div
          class="layer-item"
          :class="{ active: layer.visible }"
          @click="toggle(layer)"
        >
          <div class="layer-left">
            <span class="layer-icon" v-html="getIcon(layer.id)" />
            <span class="layer-name">{{ layer.name }}</span>
          </div>
          <div class="layer-right">
            <input
              type="checkbox"
              :checked="layer.visible"
              class="layer-checkbox"
              @click.stop
              @change="toggle(layer, $event.target.checked)"
            >
            <svg
              class="arrow-icon"
              :class="{ expanded: isExpanded(layer.id) }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <Transition name="expand">
          <div
            v-if="isExpanded(layer.id) && layer.visible"
            class="layer-children"
          >
            <div class="opacity-control">
              <span class="opacity-label">透明度</span>
              <input
                type="range"
                min="0"
                max="100"
                :value="layer.opacity * 100"
                class="opacity-slider"
                @input="setOpacity(layer, $event)"
              >
              <span class="opacity-value">{{ Math.round(layer.opacity * 100) }}%</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="panel-footer">
      <button class="add-layer-btn">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        添加自定义图层
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  layers: Array,
  onToggle: Function,
  onOpacity: Function
})

const expandedIds = ref(new Set())

const iconMap = {
  borders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  countries: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
  atmosphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/><path d="M17.5 14c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/><path d="M17.5 9c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/></svg>`,
  hydrosphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20M2 12c0-5 4.5-8 10-8s10 3 10 8"/><path d="M2 12c0 5 4.5 8 10 8s10-3 10-8"/></svg>`,
  biosphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9z"/><path d="M12 22V4"/><path d="M12 13c2.5-2.5 5-3 8-1.5"/></svg>`,
  anthroposphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  terrain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 20 6-12 4 8 4-6 4 10H3z"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
}

function getIcon(id) {
  return iconMap[id] || iconMap.default
}

function isExpanded(id) {
  return expandedIds.value.has(id)
}

function toggle(layer, forcedValue) {
  const visible = typeof forcedValue === 'boolean' ? forcedValue : !layer.visible
  props.onToggle?.(layer.id, visible)
  if (visible && !expandedIds.value.has(layer.id)) {
    expandedIds.value.add(layer.id)
  }
}

function setOpacity(layer, event) {
  props.onOpacity?.(layer.id, event.target.value / 100)
}
</script>

<style scoped>
.layer-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--tv-md);
}

.panel-header {
  margin-bottom: var(--tv-lg);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--tv-primary);
  line-height: 28px;
}

.panel-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--tv-on-surface-variant);
  letter-spacing: 0.02em;
  margin-top: 2px;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--tv-xs);
  padding-right: var(--tv-xs);
}

.layer-group {
  display: flex;
  flex-direction: column;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tv-sm);
  border-radius: var(--tv-radius-lg);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  color: var(--tv-on-surface-variant);
}

.layer-item:hover {
  background: var(--tv-surface-container);
  color: var(--tv-on-surface);
}

.layer-item.active {
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
}

.layer-left {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
}

.layer-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layer-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.layer-name {
  font-size: 14px;
  font-weight: 500;
}

.layer-right {
  display: flex;
  align-items: center;
  gap: var(--tv-xs);
}

.layer-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--tv-primary);
  cursor: pointer;
}

.arrow-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.arrow-icon.expanded {
  transform: rotate(180deg);
}

.layer-children {
  padding: var(--tv-xs) var(--tv-sm) var(--tv-sm) 40px;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
}

.opacity-label {
  font-size: 12px;
  color: var(--tv-on-surface-variant);
  flex-shrink: 0;
}

.opacity-slider {
  flex: 1;
  height: 4px;
  accent-color: var(--tv-primary);
  cursor: pointer;
}

.opacity-value {
  font-size: 11px;
  color: var(--tv-on-surface-variant);
  min-width: 32px;
  text-align: right;
}

.panel-footer {
  margin-top: auto;
  padding-top: var(--tv-md);
  border-top: 1px solid var(--tv-outline-variant);
}

.add-layer-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--tv-xs);
  padding: var(--tv-sm);
  border-radius: var(--tv-radius-md);
  border: 1px solid var(--tv-outline-variant);
  background: var(--tv-surface-container-lowest);
  color: var(--tv-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-layer-btn:hover {
  background: var(--tv-primary);
  color: var(--tv-on-primary);
  border-color: var(--tv-primary);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 80px;
}
</style>
