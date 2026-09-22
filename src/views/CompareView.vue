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

    <!-- 右键菜单与信息面板原先只挂在 EarthView 的 v-else 分支里：
         分屏下右键已经 preventDefault，却又什么都不弹，等于把交互做成了死路 -->
    <aside
      v-if="interactionStore.showInfoPanel"
      class="right-panel tv-glass-panel"
    >
      <InfoPanel />
    </aside>
    <ContextMenu :on-fly-to="handleFlyTo" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import EarthCanvas from '../components/EarthCanvas.vue'
import ContextMenu from '../components/ContextMenu.vue'
import InfoPanel from '../components/InfoPanel.vue'
import { useInteractionStore } from '../stores/useInteractionStore'

const emit = defineEmits(['back'])
const interactionStore = useInteractionStore()
const syncRotate = ref(false)
const leftCanvas = ref<InstanceType<typeof EarthCanvas> | null>(null)
const rightCanvas = ref<InstanceType<typeof EarthCanvas> | null>(null)

/** 分屏里「飞到这里」应当两块一起看，不然对比个寂寞 */
function handleFlyTo(lon: number, lat: number) {
  leftCanvas.value?.flyTo(lon, lat)
  rightCanvas.value?.flyTo(lon, lat)
}

onUnmounted(() => {
  // 两块画布都不是 primary，不会去清全局交互状态；
  // 不在这里清的话，退出分屏后主视图会凭空弹出刚才在分屏里点过的那块面板
  interactionStore.closeInfoPanel()
  interactionStore.closeContextMenu()
})

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
/* 与 EarthView 的 .right-panel 同构：InfoPanel 自身只负责内容，定位靠宿主 */
.right-panel {
  position: absolute;
  right: var(--tv-margin);
  top: var(--tv-margin);
  bottom: var(--tv-margin);
  width: var(--tv-info-panel-width);
  z-index: 300;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
