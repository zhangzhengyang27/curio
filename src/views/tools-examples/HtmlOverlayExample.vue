<template>
  <ToolsExampleShell
    title="HTML 覆盖物"
    description="把任意 HTML 内容钉在地理坐标上，转到地球背面自动隐藏（VcOverlayHtml）。"
    :view="{ lon: 112, lat: 31.5, height: 5200000 }"
  >
    <div
      class="tool-panel cu-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        城市天气卡片
      </h3>
      <p class="panel-text">
        {{ MARKERS.length }} 张天气卡片钉在城市坐标上，随地图缩放/旋转，转到背面自动隐藏（autoHidden）。
      </p>
      <button
        class="tool-btn"
        data-testid="html-toggle"
        @click="htmlShow = !htmlShow"
      >
        {{ htmlShow ? '隐藏卡片' : '显示卡片' }}
      </button>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <template v-if="htmlShow">
      <VcOverlayHtml
        v-for="m in MARKERS"
        :key="m.name"
        :position="[m.lon, m.lat, 0]"
        :pixel-offset="[0, -52]"
        custom-class="cu-html-anchor"
      >
        <div
          class="weather-card"
          :style="{ borderColor: m.color }"
          :data-city="m.name"
        >
          <span
            class="weather-name"
            :style="{ color: m.color }"
          >{{ m.name }}</span>
          <span class="weather-temp">{{ m.temp }}°C</span>
          <span class="weather-desc">{{ m.desc }}</span>
        </div>
      </VcOverlayHtml>
    </template>
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { VcOverlayHtml } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const MARKERS = [
  { name: '北京', lon: 116.4, lat: 39.9, temp: 14, desc: '晴 · 西北风3级', color: '#7ecbff' },
  { name: '上海', lon: 121.47, lat: 31.23, temp: 21, desc: '多云 · 东风2级', color: '#9fd0a8' },
  { name: '武汉', lon: 114.3, lat: 30.6, temp: 23, desc: '阴 · 微风', color: '#ffd94d' },
  { name: '成都', lon: 104.07, lat: 30.66, temp: 18, desc: '小雨 · 北风1级', color: '#ffb07c' },
  { name: '广州', lon: 113.26, lat: 23.13, temp: 29, desc: '雷阵雨 · 南风2级', color: '#ff8c9f' },
]

const htmlShow = ref(true)
const statusText = computed(() =>
  `${htmlShow.value ? `${MARKERS.length} 张卡片显示中` : '卡片已隐藏'}`,
)
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

<!-- 卡片样式须全局:overlay 内容挂到 viewer 容器,不在本组件 scoped 作用域内 -->
<style>
.weather-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 108px;
  padding: 8px 10px;
  border: 1px solid;
  border-left-width: 3px;
  border-radius: 10px;
  background: rgb(10 26 42 / 82%);
  box-shadow: 0 4px 14px rgb(0 0 0 / 45%);
  transform: translate(-50%, -100%);
  font-family: inherit;
  user-select: none;
}

.weather-name {
  font-size: 12px;
  font-weight: 600;
}

.weather-temp {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}

.weather-desc {
  font-size: 10px;
  color: var(--cu-on-surface-variant);
}
</style>
