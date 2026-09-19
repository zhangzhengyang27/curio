<template>
  <ToolsExampleShell
    title="导航控件"
    description="右上角控件集：罗盘拖动旋转视角、缩放按钮、我的位置、打印、状态栏（相机姿态）与距离比例尺；顶部细线为瓦片请求进度条（VcAjaxBar）。"
  >
    <VcNavigation position="top-right" />
    <VcAjaxBar
      data-testid="ajax-bar"
      position="top"
      size="3px"
      color="#4da3ff"
    />
  </ToolsExampleShell>
</template>

<script setup lang="ts">
import { VcNavigation, VcAjaxBar } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'
</script>
