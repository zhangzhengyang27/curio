<template>
  <div class="compare-view">
    <div class="split-pane">
      <EarthCanvas
        ref="leftCanvas"
        :primary="false"
      />
      <div class="pane-label">
        基准年
      </div>
    </div>
    <div class="split-pane">
      <EarthCanvas
        ref="rightCanvas"
        :primary="false"
      />
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
import { ref, watch, onUnmounted } from 'vue'
import EarthCanvas from '../components/EarthCanvas.vue'

const emit = defineEmits(['back'])
const syncRotate = ref(false)
const leftCanvas = ref<InstanceType<typeof EarthCanvas> | null>(null)
const rightCanvas = ref<InstanceType<typeof EarthCanvas> | null>(null)

// 「联动」以前只写 syncRotate、没人读，是个假开关。
// 现在开启时把左栏的相机（拖拽/缩放的结果）逐帧镜像到右栏 ——
// 两块地球各自的自转仍由各自的渲染循环驱动，联的是观察视角。
let syncRaf = 0
function syncLoop(): void {
  const lc = leftCanvas.value?.getControls()
  const rc = rightCanvas.value?.getControls()
  if (lc && rc) {
    rc.object.position.copy(lc.object.position)
    rc.target.copy(lc.target)
    rc.update()
  }
  syncRaf = requestAnimationFrame(syncLoop)
}

watch(syncRotate, (on) => {
  if (on && !syncRaf) syncRaf = requestAnimationFrame(syncLoop)
  if (!on && syncRaf) {
    cancelAnimationFrame(syncRaf)
    syncRaf = 0
  }
})

onUnmounted(() => {
  if (syncRaf) cancelAnimationFrame(syncRaf)
})

function goBack() {
  emit('back')
}
</script>

<style scoped>
/* 顶栏是 fixed 的，本视图在正常流里从 y=0 开始：不扣掉顶栏高度会整块被压住 56px */
.compare-view {
  width: 100%; height: calc(100vh - var(--tv-top-nav-height)); margin-top: var(--tv-top-nav-height);
  display: flex; position: relative;
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
