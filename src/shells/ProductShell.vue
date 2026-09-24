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
 * 数据产品外壳：数字地球平台主站 —— 开场地球 + 地图工具箱 + 全球数据分析 +
 * 地震应急监测 + 分析工作台。
 *
 * 与示例资源库外壳物理分开（P1-2）。此前两者共用 App.vue 那条 8 项顶栏，
 * 4 个产品功能和 4 个示例集平铺在同一层，用户无法判断「这是软件还是素材库」；
 * 更要紧的是那条顶栏搜索挂在两个产品共用的壳上，在任何页面敲一个字符
 * 都会把用户拽去 /examples —— 首页地球场景随之销毁且不可恢复。
 *
 * 所以本外壳**没有搜索框**：产品内没有 1417 条示例可搜，
 * 跨产品搜索属于另一个外壳的职责。
 *
 * 2026-09-24 T02：/tools 从资源库外壳迁入（平台页②挂在资源库壳是历史错位）；
 * 导航文案统一为各页面自身的名字，不再有「业务监控 vs 地震应急监测」式不一致。
 */
import ShellNav from './ShellNav.vue'

const links = [
  { to: '/', label: '地球', exact: true },
  { to: '/tools', label: '地图工具箱' },
  { to: '/analysis', label: '全球数据分析' },
  { to: '/monitor', label: '地震应急监测' },
  { to: '/workbench', label: '分析工作台' },
]
</script>
