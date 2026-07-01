<template>
  <div class="layer-panel">
    <div
      class="layer-header"
      @click="expanded = !expanded"
    >
      <span>📐 图层</span>
      <span class="arrow">{{ expanded ? '▾' : '▸' }}</span>
    </div>
    <Transition name="expand">
      <div
        v-if="expanded"
        class="layer-list"
      >
        <div
          v-for="layer in layers"
          :key="layer.id"
          class="layer-item"
        >
          <label class="layer-name">
            <input
              type="checkbox"
              :checked="layer.visible"
              @change="toggle(layer)"
            >
            {{ layer.name }}
          </label>
          <input
            v-if="layer.visible"
            type="range"
            min="0"
            max="100"
            :value="layer.opacity * 100"
            class="opacity-slider"
            @input="setOpacity(layer, $event)"
          >
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const expanded = ref(false)

const props = defineProps({
  layers: Array,
  onToggle: Function,
  onOpacity: Function
})

function toggle(layer) {
  props.onToggle?.(layer.id, !layer.visible)
}

function setOpacity(layer, event) {
  props.onOpacity?.(layer.id, event.target.value / 100)
}
</script>

<style scoped>
.layer-panel {
  position: fixed;
  left: 20px;
  top: 80px;
  background: rgba(15, 15, 35, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  z-index: 100;
  min-width: 200px;
  overflow: hidden;
}
.layer-header {
  padding: 10px 16px;
  color: #ccc;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  user-select: none;
}
.layer-header:hover {
  background: rgba(255,255,255,0.03);
}
.layer-list {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
}
.layer-item:hover {
  background: rgba(255,255,255,0.04);
}
.layer-name {
  color: #ccc;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
}
.layer-name input[type="checkbox"] {
  accent-color: #00cccc;
}
.opacity-slider {
  width: 60px;
  height: 4px;
  accent-color: #00cccc;
  cursor: pointer;
}
.arrow {
  font-size: 12px;
  color: #666;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
