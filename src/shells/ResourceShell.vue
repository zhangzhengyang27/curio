<template>
  <ShellNav
    :links="links"
    tag="示例库"
    home-to="/three-globe"
    switch-to="/"
    switch-label="返回地球"
  />
  <RouterView />
</template>

<script setup lang="ts">
/**
 * 示例资源库外壳：ThreeGlobe 示例集 + 百度地图。
 * （/examples 示例中心已于 2026-10-15 整体移除，内容归 html5-dataviz 项目；
 *   /tools 更早迁入产品外壳 —— 它是平台页②。）
 *
 * 顶栏搜索框曾挂在这个壳上（数据源是示例 registry），随示例中心一并移除 ——
 * 历史背景：搜索框更早之前挂在两产品共用的壳上，在任何页面敲一个字符都会
 * 把用户拽去 /examples，首页地球场景随之销毁且不可恢复（KNOWN_PITFALLS C15）。
 */
import ShellNav from './ShellNav.vue'

const links = [
  { to: '/three-globe', label: 'ThreeGlobe' },
  { to: '/bmap', label: '百度地图' },
]
</script>
