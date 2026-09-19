<template>
  <ToolsExampleShell
    title="小屏导航"
    description="紧凑版罗盘 + 缩放控件，适合小尺寸地图容器（VcNavigationSm）。"
  >
    <div
      class="tool-panel tv-glass-panel"
      data-testid="example-panel"
    >
      <h3 class="panel-title">
        小屏导航
      </h3>
      <p class="panel-text">
        右上角为紧凑罗盘与「+ / −」缩放按钮：拖动罗盘外环旋转视角，点击罗盘复位指北。
      </p>
      <p
        class="status"
        data-testid="example-status"
      >
        {{ statusText }}
      </p>
    </div>
    <VcNavigationSm
      position="top-right"
      @ready="onReady"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VcNavigationSm } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'

const statusText = ref('加载中…')
function onReady() {
  statusText.value = '小屏导航就绪：拖罗盘转视角，± 号缩放'
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
