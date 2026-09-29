<template>
  <ToolsExampleShell
    title="热力图"
    description="武汉城市圈人口热度模拟：约 360 个热力点经 heatmap.js 渲染成渐变热力层，叠加在影像上（VcOverlayHeatmap）。"
    :view="{ lon: 114.5, lat: 30.6, height: 300000 }"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        热力图
      </h3>
      <p class="panel-text">
        热力点 {{ HEAT_POINTS.length }} 个（6 个城市中心高斯散布），值域 0~100，黄→红为高值区。
      </p>
      <button
        class="tool-btn"
        data-testid="heat-toggle"
        @click="heatShow = !heatShow"
      >
        {{ heatShow ? '隐藏热力层' : '显示热力层' }}
      </button>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverlayHeatmap
      :show="heatShow"
      :rectangle="HEAT_RECT"
      :min="0"
      :max="100"
      :data="HEAT_POINTS"
      :options="HEAT_OPTIONS"
      :segments="(HEAT_SEGMENTS as any)"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VcOverlayHeatmap } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

// 数据在模块作用域一次性生成:稳定引用,避免父组件重渲染触发 overlay 重建
function makePoints() {
  const centers = [
    [114.3, 30.59], [114.88, 30.39], [114.06, 30.95],
    [115.02, 30.22], [113.9, 31.05], [114.6, 30.9],
  ]
  const pts = []
  // 线性同余伪随机,保证每次加载分布一致(E2E 截图可比对)
  let seed = 42
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 60; i++) {
      pts.push({
        x: cx + (rnd() - 0.5) * 0.22,
        y: cy + (rnd() - 0.5) * 0.16,
        value: 20 + Math.floor(rnd() * 80),
      })
    }
  }
  return pts
}
const HEAT_POINTS = makePoints()
// [西, 南, 东, 北](度)
const HEAT_RECT = [113.6, 29.8, 115.3, 31.4]
const HEAT_OPTIONS = { radius: 18, blur: 0.85, maxOpacity: 0.65, minOpacity: 0.08 }
const HEAT_SEGMENTS = [
  [10, 'rgba(49, 54, 149, 0)'],
  [30, '#2f9f6e'],
  [55, '#ffd94d'],
  [80, '#ff8c2f'],
  [100, "#e8312f"],
] as any

const heatShow = ref(true)
const statusText = computed(() =>
  `${heatShow.value ? '显示中' : '已隐藏'} · 热力点 ${HEAT_POINTS.length} 个`,
)
function onReady() {
  // ready 后状态即由 statusText 反映,无需额外处理
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
  color: var(--cu-on-surface-variant);
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: rgb(255 255 255 / 6%);
  color: var(--cu-on-surface);
  font-size: 12px;
  cursor: pointer;
}

.tool-btn:hover {
  background: rgb(255 255 255 / 14%);
}

.status {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--cu-success);
}
</style>
