<template>
  <ShellNav
    :links="links"
    tag="示例库"
    home-to="/examples"
    switch-to="/"
    switch-label="返回地球"
  >
    <div class="nav-search">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle
          cx="11"
          cy="11"
          r="8"
        />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="keyword"
        type="text"
        class="search-input"
        placeholder="搜索示例..."
        @input="onInput"
        @keydown.enter="submit"
        @focus="ensureRegistryLoaded"
      >
    </div>
  </ShellNav>
  <RouterView />
</template>

<script setup lang="ts">
/**
 * 示例资源库外壳：1417 条示例画廊 + ThreeGlobe + 百度地图。
 * （/tools 曾长期挂在本壳，2026-09-24 T02 起迁入产品外壳 —— 它是平台页②。）
 *
 * 搜索框只存在于这个外壳里（数据产品外壳没有），所以它再也无法把用户
 * 从首页地球上拽走。行为契约与 P0-3 一致：
 *   - 已在 /examples 上：输入即就地 router.replace 写 ?search=，不产生历史记录
 *   - 在本外壳的其它页（/bmap /three-globe）：输入不动，回车才跳转
 *   - 只带 tech/sub，不带 page（搜索词变了沿用旧页码会落到空白网格），
 *     也不把别页的 query 透传进来
 */
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LocationQueryRaw } from 'vue-router'
import ShellNav from './ShellNav.vue'
import { useExampleFilters } from '../examples/composables/useExampleFilters'

const links = [
  { to: '/examples', label: '示例中心' },
  { to: '/three-globe', label: 'ThreeGlobe' },
  { to: '/bmap', label: '百度地图' },
]

const route = useRoute()
const router = useRouter()
const { ensureRegistryLoaded } = useExampleFilters()

const keyword = ref(typeof route.query.search === 'string' ? route.query.search : '')
const onGallery = computed(() => route.path === '/examples')

// 画廊里改搜索词会写回 URL，这里跟着 URL 走，前进/后退才不会错位
watch(() => route.query.search, val => {
  const next = Array.isArray(val) ? val.join(',') : (val ?? '')
  if (next !== keyword.value) keyword.value = next
})

function buildQuery(): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  for (const key of ['tech', 'sub'] as const) {
    const val = route.query[key]
    if (typeof val === 'string' && val) query[key] = val
  }
  const kw = keyword.value.trim()
  if (kw) query.search = kw
  return query
}

let timer: ReturnType<typeof setTimeout> | null = null
function onInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    if (!onGallery.value) return
    router.replace({ path: '/examples', query: buildQuery() })
  }, 300)
}

function submit() {
  if (timer) clearTimeout(timer)
  router.push({ path: '/examples', query: buildQuery() })
}
</script>
