<template>
  <component :is="shell" />
</template>

<script setup lang="ts">
/**
 * 只做一件事：按当前路由挑外壳。
 *
 * 用「按路由选组件」而不是嵌套路由：router 的 11 条记录一行都不用改，
 * 深链、书签、E2E 选择器全部照旧。两个外壳都保持顶栏高度为
 * --tv-top-nav-height（56px）不变，所以全站 19 处 / 14 个文件里
 * 硬依赖这个变量的页面偏移也不需要跟着改。
 *
 * 拆掉的两样东西是有意的：
 *   - 顶栏搜索：它原先挂在两个产品共用的壳上，在任何页面敲一个字符都会把用户
 *     拽去 /examples，首页地球场景随之销毁且不可恢复。现在它只在资源库外壳里，
 *     跨产品跳转这个副作用从结构上不存在了。
 *   - .user-avatar：一个非交互的 <div>，长得像账号入口但点不动。
 */
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductShell from './shells/ProductShell.vue'
import ResourceShell from './shells/ResourceShell.vue'
import { useThemeStore } from './stores/useThemeStore'

/** 示例资源库的四个入口前缀；其余（含首页与未知路径）都归数据产品外壳 */
const RESOURCE_PREFIXES = ['examples', 'three-globe', 'tools', 'bmap']

const route = useRoute()
const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})

const shell = computed(() => {
  const first = route.path.split('/')[1]
  return RESOURCE_PREFIXES.includes(first) ? ResourceShell : ProductShell
})
</script>
