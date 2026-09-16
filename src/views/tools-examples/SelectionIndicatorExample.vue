<template>
  <ToolsExampleShell
    title="拾取指示器"
    description="点击地图上的测试点，屏幕出现取景框式指示器并跟随目标（VcSelectionIndicator，替换 Cesium 自带 selectionIndicator）。"
    @viewer-ready="onViewerReady"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        拾取指示器
      </h3>
      <p class="panel-text">
        地图上已布设 {{ ENTITIES.length }} 个测试点。左键点击任意点：绿色取景框会锁定它；点击空白处指示器复位。已拾取 {{ pickCount }} 次。
      </p>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcSelectionIndicator
      :allow-feature-info-requests="false"
      :limit="10"
      @pick-evt="onPickEvt"
    />
  </ToolsExampleShell>
</template>

<script setup>
import { ref } from 'vue'
import { VcSelectionIndicator } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const ENTITIES = [
  { lon: 114.3, lat: 30.6, name: '武汉 · 测试点' },
  { lon: 112.94, lat: 28.23, name: '长沙 · 测试点' },
  { lon: 115.86, lat: 28.68, name: '南昌 · 测试点' },
  { lon: 117.28, lat: 31.86, name: '合肥 · 测试点' },
]

const pickCount = ref(0)
const statusText = ref('等待拾取…')

function onViewerReady(viewer, Cesium) {
  ENTITIES.forEach(({ lon, lat, name }) => {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      name,
      point: {
        pixelSize: 14,
        color: Cesium.Color.ORANGE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: name,
        font: '13px sans-serif',
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(10,30,50,0.75)'),
        pixelOffset: new Cesium.Cartesian2(0, -26),
      },
    })
  })
}

function onPickEvt(picked) {
  pickCount.value++
  const name = picked?.id?.name || picked?.name || '未知目标'
  statusText.value = `第 ${pickCount.value} 次拾取：${name}`
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
  color: #b9c6d4;
}

.status {
  margin: 0;
  font-size: 12px;
  color: #9fd0a8;
}
</style>
