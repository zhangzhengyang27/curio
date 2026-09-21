<template>
  <ToolsExampleShell
    title="鹰眼图"
    description="小窗与主图视野双向联动：拖动主图时红框实时指示当前范围，点击小窗任意位置主图即平移过去（VcOverviewMap）。"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        鹰眼图
      </h3>
      <p class="panel-text">
        主视图右下角即小地图，可点击折叠/展开。
      </p>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcOverviewMap
      width="220"
      height="150"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VcOverviewMap } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const statusText = ref('加载中…')
function onReady() {
  statusText.value = '鹰眼图就绪：小窗随主图视野联动'
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
  color: var(--tv-on-surface-variant);
}

.status {
  margin: 0;
  font-size: 12px;
  color: var(--tv-success);
}
</style>
