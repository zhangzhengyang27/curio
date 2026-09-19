<template>
  <ToolsExampleShell
    title="淹没分析"
    description="对固定区域做水位上涨模拟。地形来自 ArcGIS 高程服务（需外网，仅本页挂载渲染；工具箱主页面保持椭球渲染不受影响），加载失败时退化为平面演示。"
    :view="{ lon: 114.3, lat: 30.58, height: 18_000 }"
    @viewer-ready="onViewerReady"
  >
    <div class="tool-panel tv-glass-panel">
      <h3 class="panel-title">
        水位模拟
      </h3>
      <p class="terrain-status">
        {{ terrainStatus }}
      </p>
      <div class="btn-row">
        <button
          class="tool-btn"
          data-testid="flood-start"
          @click="start"
        >
          开始
        </button>
        <button
          class="tool-btn"
          data-testid="flood-pause"
          @click="pause"
        >
          暂停/继续
        </button>
        <button
          class="tool-btn"
          data-testid="flood-stop"
          @click="stop"
        >
          结束
        </button>
      </div>
      <p
        class="status"
        data-testid="flood-status"
      >
        {{ statusText }}
      </p>
    </div>

    <VcAnalysisFlood
      ref="floodRef"
      :polygon-hierarchy="AREA"
      :min-height="0"
      :max-height="150"
      :speed="2"
      @stop="onStop"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { VcAnalysisFlood } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'
import { getArcgisTerrainSampler } from '../../map/terrainSampler'

/** 武汉长江右岸城区范围（度） */
const AREA = [
  [114.26, 30.55],
  [114.36, 30.55],
  [114.36, 30.63],
  [114.26, 30.63],
]

const floodRef = ref<any>(null)
const terrainStatus = ref('地形加载中…')
const running = ref(false)
const waterLevel = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null

const statusText = computed(() =>
  running.value ? `当前水位 ${waterLevel.value} m（0 → 150 m）` : '点击「开始」模拟水位上涨',
)

/** 仅本页挂地形渲染（淹没分析的前提）。getArcgisTerrainSampler 单例，
 *  失败自动清缓存可重试；挂载与否不影响其它页面的椭球渲染架构 */
async function onViewerReady(viewer: any) {
  try {
    const provider = await getArcgisTerrainSampler()
    viewer.terrainProvider = provider
    terrainStatus.value = '地形已加载（ArcGIS 高程）'
  } catch {
    terrainStatus.value = '地形服务不可达，按平面演示'
  }
}

function start() {
  floodRef.value?.start()
  running.value = true
  startPolling()
}

function pause() {
  floodRef.value?.pause()
}

function stop() {
  floodRef.value?.stop()
  onStop()
}

function onStop() {
  running.value = false
  stopPolling()
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(() => {
    const h = floodRef.value?.getCurrentHeight?.()
    if (typeof h === 'number') waterLevel.value = Math.round(h)
  }, 300)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(stopPolling)
</script>

<style scoped>
.panel-title {
  margin: 0 0 8px;
  font-size: 14px;
  color: #fff;
}

.terrain-status {
  margin: 0 0 10px;
  font-size: 12px;
  color: #b9c6d4;
}

.btn-row {
  display: flex;
  gap: 6px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: #dce7f2;
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: #9fd0a8;
}
</style>
