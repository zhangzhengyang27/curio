<template>
  <div class="compare-view">
    <div class="split-pane">
      <EarthCanvas ref="leftCanvas" />
      <div class="pane-label">
        基准年
      </div>
    </div>
    <div class="split-pane">
      <EarthCanvas ref="rightCanvas" />
      <div class="pane-label">
        对比年
      </div>
    </div>
    <div class="compare-controls">
      <button
        class="ctrl-btn"
        @click="goBack"
      >
        ← 返回
      </button>
      <span class="ctrl-label">双屏对比</span>
      <button
        class="ctrl-btn"
        :class="{ active: syncRotate }"
        @click="syncRotate = !syncRotate"
      >
        联动 {{ syncRotate ? '✓' : '' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EarthCanvas from '../components/EarthCanvas.vue'

const emit = defineEmits(['back'])
const syncRotate = ref(false)
const leftCanvas = ref(null)
const rightCanvas = ref(null)

function goBack() {
  emit('back')
}
</script>

<style scoped>
.compare-view {
  width: 100vw; height: 100vh; display: flex; position: relative;
}
.split-pane {
  flex: 1; position: relative; overflow: hidden; border-right: 1px solid rgba(255,255,255,0.1);
}
.split-pane:last-child { border-right: 0; }
.pane-label {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(15,15,35,0.8); color: #888; padding: 4px 14px;
  border-radius: 12px; font-size: 12px; backdrop-filter: blur(10px);
  pointer-events: none; z-index: 10;
}
.compare-controls {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: rgba(15,15,35,0.9); padding: 8px 16px;
  border-radius: 24px; backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08); z-index: 200;
}
.ctrl-btn {
  background: rgba(255,255,255,0.1); border: none; color: #ccc;
  padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer;
  transition: all 0.2s;
}
.ctrl-btn:hover { background: rgba(255,255,255,0.15); }
.ctrl-btn.active { background: rgba(0,204,204,0.2); color: #00cccc; }
.ctrl-label { color: #888; font-size: 13px; }
</style>
