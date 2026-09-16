<template>
  <ToolsExampleShell
    title="导航控件"
    description="右上角控件集：罗盘拖动旋转视角、缩放按钮、我的位置、打印、状态栏（相机姿态）与距离比例尺。"
  >
    <VcNavigation position="top-right" />
  </ToolsExampleShell>
</template>

<script setup>
import { VcNavigation } from 'vue-cesium'
import ToolsExampleShell from './ToolsExampleShell.vue'
</script>
