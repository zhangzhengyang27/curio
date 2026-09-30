<template>
  <ToolsExampleShell
    title="ECharts 图层"
    description="以武汉为中心的航线辐射图：城市标记 + 航线网络，坐标由 ECharts 的 cesium 坐标系直接映射到地球（VcOverlayEcharts）。"
    :view="{ lon: 106, lat: 31, height: 8000000 }"
  >
    <div
      class="tool-panel cu-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        ECharts 航线图
      </h3>
      <p class="panel-text">
        {{ CITIES.length }} 个城市节点、{{ ROUTES.length }} 条航线，全部数据为 lng/lat 坐标，无需单独的地图容器。
      </p>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverlayEcharts
      :options="(ECHARTS_OPTION as any)"
      custom-class="tv-echarts-full"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VcOverlayEcharts } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const HUB = { name: '武汉', lnglat: [114.3, 30.6] }
const CITIES = [
  { name: '北京', lnglat: [116.4, 39.9] },
  { name: '上海', lnglat: [121.47, 31.23] },
  { name: '广州', lnglat: [113.26, 23.13] },
  { name: '成都', lnglat: [104.07, 30.66] },
  { name: '乌鲁木齐', lnglat: [87.62, 43.82] },
  { name: '哈尔滨', lnglat: [126.63, 45.75] },
  { name: '三亚', lnglat: [109.51, 18.25] },
]
const ROUTES = CITIES.map((c) => ({ coords: [HUB.lnglat, c.lnglat] }))

// echarts 由 vue-cesium 自带依赖提供(3.2.12 dependencies 声明,无需单独安装);
// 不用远程图片 symbol,离线可跑。coordinateSystem:'cesium' 由组件内部注册。
// ⚠ 用静态 scatter/lines:VcOverlayEcharts 每帧 chart.resize 触发整图重绘,
// 叠加 rippleEffect/飞线动画后 Intel 核显实测仅 2 FPS(见 CHANGELOG 2026-09-17)。
const ECHARTS_OPTION = {
  series: [
    {
      name: '航线',
      type: 'lines',
      coordinateSystem: 'cesium',
      lineStyle: { color: '#3fa7ff', width: 2, opacity: 0.5 },
      data: ROUTES,
    },
    {
      name: '城市',
      type: 'scatter',
      coordinateSystem: 'cesium',
      symbolSize: 12,
      label: {
        show: true,
        formatter: '{b}',
        position: 'right',
        fontSize: 12,
        color: '#fff',
        textBorderColor: '#0a2a4a',
        textBorderWidth: 2,
      },
      itemStyle: { color: '#ffd94d' },
      data: [{ name: HUB.name, value: [...HUB.lnglat, 100] }]
        .concat(CITIES.map((c) => ({ name: c.name, value: [...c.lnglat, 60] }))),
    },
  ],
}

const statusText = ref('加载中…')
function onReady() {
  statusText.value = `图层就绪：${CITIES.length + 1} 节点 / ${ROUTES.length} 条航线`
}
</script>

<style scoped>
.panel-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #fff;
}

.panel-text {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--cu-on-surface-variant);
}

.status {
  margin: 0;
  font-size: 12px;
  color: var(--cu-success);
}
</style>

<!-- 全局样式:VcOverlayEcharts 的容器 div 没有内置宽高,echarts.init 会在
     0×0 容器上建画布,zrender 涟漪动画逐帧抛 drawImage 异常且什么都画不出;
     必须显式铺满 viewer 容器(内容不在本组件 scoped 作用域内,须全局) -->
<style>
.tv-echarts-full {
  width: 100% !important;
  height: 100% !important;
}
</style>
