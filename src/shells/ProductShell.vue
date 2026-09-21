<template>
  <ShellNav
    :links="links"
    home-to="/"
    switch-to="/examples"
    switch-label="示例中心"
  />
  <RouterView />
</template>

<script setup lang="ts">
/**
 * 数据产品外壳：三维地球可视化 + 全球分析 + 分析工作台 + 业务监控。
 *
 * 与示例资源库外壳物理分开（P1-2）。此前两者共用 App.vue 那条 8 项顶栏，
 * 4 个产品功能和 4 个示例集平铺在同一层，用户无法判断「这是软件还是素材库」；
 * 更要紧的是那条顶栏搜索挂在两个产品共用的壳上，在任何页面敲一个字符
 * 都会把用户拽去 /examples —— 首页地球场景随之销毁且不可恢复。
 *
 * 所以本外壳**没有搜索框**：产品内没有 1417 条示例可搜，
 * 跨产品搜索属于另一个外壳的职责。
 */
import ShellNav from './ShellNav.vue'

const links = [
  { to: '/', label: '地球', exact: true },
  { to: '/analysis', label: '全球分析' },
  { to: '/workbench', label: '分析工作台' },
  { to: '/monitor', label: '业务监控' },
]
</script>
