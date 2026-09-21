<template>
  <ToolsExampleShell
    title="动态对象"
    description="沿时间轴巡飞的无人机：SampledPositionProperty 驱动位置插值，路径尾迹实时绘制，时钟倍速可调（VcOverlayDynamic）。"
    :view="{ lon: 114.3, lat: 30.6, height: 120000 }"
    @viewer-ready="onViewerReady"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        巡检无人机
      </h3>
      <p class="panel-text">
        环武汉城郊一圈（约 10 分钟模拟时长），青色点为当前位置，光晕尾迹为历史航迹。
      </p>
      <div class="btn-row">
        <button
          class="tool-btn"
          data-testid="dynamic-play"
          @click="running = !running"
        >
          {{ running ? '暂停' : '继续' }}
        </button>
        <button
          class="tool-btn"
          data-testid="dynamic-speed"
          @click="cycleSpeed"
        >
          倍速 ×{{ multiplier }}
        </button>
      </div>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverlayDynamic
      v-if="clock"
      v-model:current-time="currentTime"
      :start-time="clock.start"
      :stop-time="clock.stop"
      :should-animate="running"
      :multiplier="multiplier"
      :clock-range="1"
      :dynamic-overlays="OVERLAYS"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { VcOverlayDynamic } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const SPEEDS = [10, 30, 60]
const speedIdx = ref(1)
const multiplier = computed(() => SPEEDS[speedIdx.value])
function cycleSpeed() {
  speedIdx.value = (speedIdx.value + 1) % SPEEDS.length
}
const running = ref(true)

const clock = shallowRef<any>(null)
const currentTime = shallowRef<any>(null)
// VcOverlayDynamic 要求每个条目自带 sampledPositions 数组(组件内部逐条
// addPosition 建 SampledPositionProperty);传 Entity 式 position 会在其
// transform 阶段 sampledPositions.forEach 崩溃,打断渲染循环(球面全黑,实测)
const OVERLAYS = shallowRef<any[]>([])

function onViewerReady(viewer: any, Cesium: any) {
  const start = Cesium.JulianDate.fromDate(new Date())
  const stop = Cesium.JulianDate.addMinutes(start, 10, new Cesium.JulianDate())
  clock.value = { start, stop }
  currentTime.value = Cesium.JulianDate.clone(start)

  // 环形航线:24 个采样点(10 分钟一圈),高度 9km
  const N = 24
  const sampledPositions = []
  for (let i = 0; i <= N; i++) {
    const ang = (i / N) * Math.PI * 2
    sampledPositions.push({
      id: `p-${i}`,
      position: [114.3 + 0.36 * Math.cos(ang), 30.6 + 0.26 * Math.sin(ang), 9000],
      time: Cesium.JulianDate.toIso8601(
        Cesium.JulianDate.addSeconds(start, i * (600 / N), new Cesium.JulianDate()),
      ),
    })
  }

  OVERLAYS.value = [{
    id: 'uav-01',
    name: '巡检无人机 UAV-01',
    point: {
      pixelSize: 14,
      color: '#39ffc8',
      outlineColor: '#06231b',
      outlineWidth: 2,
    },
    label: {
      text: 'UAV-01 · 9km',
      font: '12px sans-serif',
      fillColor: '#eafff7',
      showBackground: true,
      backgroundColor: 'rgba(8,30,26,0.72)',
      pixelOffset: [16, -14],
    },
    path: {
      leadTime: 0,
      trailTime: 150,
      width: 3,
      material: { type: 'PolylineGlow', color: [57, 255, 200, 160] },
    },
    sampledPositions,
  }]
}

const statusText = computed(() => {
  const Cesium = window.Cesium
  const t = currentTime.value && Cesium
    ? Cesium.JulianDate.toDate(currentTime.value).toTimeString().slice(0, 8)
    : '--:--:--'
  return `${running.value ? '巡飞中' : '已暂停'} · ×${multiplier.value} · 模拟时刻 ${t}`
})
function onReady() {
  // overlay 挂载完成,clock 由 props 驱动
}
</script>

<style scoped>
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #fff;
}

.panel-text {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--tv-on-surface-variant);
}

.btn-row {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: var(--tv-on-surface);
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--tv-success);
}
</style>
