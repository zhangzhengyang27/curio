<template>
  <ToolsExampleShell
    title="打印"
    description="右上角打印按钮，将当前地图视图（含标注）生成为可打印页面（VcPrint）。"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        地图打印
      </h3>
      <p class="panel-text">
        点击右上角相机样式的按钮，会打开打印预览窗口（含当前视野截图），浏览器打印对话框自动弹出，可另存为 PDF。
      </p>
      <button
        class="tool-btn"
        data-testid="print-trigger"
        @click="triggerPrint"
      >
        触发打印
      </button>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcPrint
      ref="printRef"
      position="top-right"
      :print-automatically="false"
      :show-print-view="true"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VcPrint } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const printRef = ref<any>(null)
const statusText = ref('就绪：点击按钮生成打印视图')
function onReady() {
  statusText.value = '就绪：点击按钮生成打印视图'
}
function triggerPrint() {
  printRef.value?.load?.()
  statusText.value = '已请求打印，打印视图窗口即将打开'
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
