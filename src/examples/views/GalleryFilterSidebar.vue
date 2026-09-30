<template>
  <GlassPanel
    as="aside"
    class="filter-sidebar"
  >
    <!--
      2026-09-27 裁剪后侧栏只剩专题分类一个维度 —— 单一列表不再需要
      可折叠的分区标题行（「专题分类 17」），直接平铺列表本身。
    -->
    <button
      v-for="cat in subFacets"
      :key="cat.key"
      type="button"
      :class="['category-item', { active: currentSubCategory === cat.key }]"
      @click="$emit('select', cat.key)"
    >
      <span class="item-label">{{ cat.label }}</span>
      <span class="item-count tv-num">{{ cat.count }}</span>
    </button>

    <!--
      分类之间是有意允许重叠的（一个示例可以同时是「着色器」和「粒子」），
      所以各类计数之和会大于「全部」。这个差值过去没有任何说明，
      用户只能把它读成「数错了」。只在真的出现重叠时才渲染。
    -->
    <p
      v-if="overlapping"
      class="sidebar-note"
    >
      一个示例可同时属于多个分类，各类之和（{{ countSum }}）大于当前范围（{{ subFacets[0]?.count ?? 0 }}）。
    </p>
  </GlassPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { GalleryFacet } from '../composables/useGalleryFilters'
import GlassPanel from '../../components/ui/GlassPanel.vue'
// 示例中心左侧筛选面板：只保留「专题分类」一个维度（2026-09-27 裁剪，
// 技术栈 / 数据源两个维度已随状态机一起移除）。
// 纯展示组件：状态由父组件的 useGalleryFilters 持有，选中只发事件。
//
// ⚠ class 名是 E2E 契约，不要顺手改：
//   .category-item / .item-label / .item-count          （专题分类）
const props = defineProps({
  currentSubCategory: { type: String, default: 'all' },
  subFacets: { type: Array as PropType<GalleryFacet[]>, default: () => [] },
})

const countSum = computed(() =>
  props.subFacets.reduce((sum, c) => (c.key === 'all' ? sum : sum + (c.count || 0)), 0),
)
const overlapping = computed(() => countSum.value > (props.subFacets[0]?.count ?? 0))

defineEmits(['select'])
</script>

<style scoped>
/* Sidebar(容器 chrome 由 GlassPanel 提供,这里只管定位与滚动) */
.filter-sidebar {
  position: sticky;
  /* 与右侧粘性工具条对齐：两者都贴在顶栏正下方，视觉上才是一条横线 */
  top: calc(var(--cu-top-nav-height) + var(--cu-sm));
  width: 260px;
  flex-shrink: 0;
  max-height: calc(100vh - var(--cu-top-nav-height) - var(--cu-lg) * 2);
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--cu-sm);
}

.filter-sidebar::-webkit-scrollbar {
  width: 4px;
}

/* 暗色基调由 GlassPanel 的 html.dark 分支接管;仅描边恢复一档——
   旧本地覆写用 --cu-outline 的动机是一次真实的「面板糊进背景」回归,
   outline-variant(0.11)在毛玻璃侧栏上太弱(M3b 终审 Minor#3) */
html.dark .filter-sidebar {
  border-color: var(--cu-outline);
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cu-sm);
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--cu-radius-md);
  border: none;
  background: transparent;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-md);
  line-height: 22px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease), color var(--cu-dur-fast) var(--cu-ease);
}

.category-item:hover {
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface);
}

.category-item.active {
  background: color-mix(in srgb, var(--cu-primary) 12%, transparent);
  color: var(--cu-primary);
  font-weight: 600;
}

.item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--cu-radius-full);
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-xs);
  line-height: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition: background var(--cu-dur-fast) var(--cu-ease), color var(--cu-dur-fast) var(--cu-ease);
}

.category-item:hover .item-count {
  background: var(--cu-surface-container-highest);
  color: var(--cu-on-surface);
}

.category-item.active .item-count {
  background: var(--cu-primary-container);
  color: var(--cu-on-primary-container);
}

.sidebar-note {
  margin: var(--cu-sm) 10px 2px;
  padding-top: var(--cu-sm);
  border-top: 1px solid var(--cu-outline-variant);
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
}
</style>
