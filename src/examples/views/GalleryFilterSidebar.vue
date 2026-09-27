<template>
  <aside class="filter-sidebar">
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
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { GalleryFacet } from '../composables/useGalleryFilters'
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
/* Sidebar */
.filter-sidebar {
  position: sticky;
  /* 与右侧粘性工具条对齐：两者都贴在顶栏正下方，视觉上才是一条横线 */
  top: calc(var(--tv-top-nav-height) + var(--tv-sm));
  width: 260px;
  flex-shrink: 0;
  max-height: calc(100vh - var(--tv-top-nav-height) - var(--tv-lg) * 2);
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--tv-sm);
  background: var(--tv-surface-container-lowest);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-lg);
  box-shadow: var(--tv-shadow-1);
}

.filter-sidebar::-webkit-scrollbar {
  width: 4px;
}

/* 暗色下 lowest 档与页面底色几乎同值，面板会整个消失在背景里
   （与卡片糊成一片同一条根因）：暗色抬到 container-low 档 + outline 描边 */
html.dark .filter-sidebar {
  background: var(--tv-surface-container-low);
  border-color: var(--tv-outline);
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tv-sm);
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--tv-radius-md);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-md);
  line-height: 22px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background var(--tv-dur-fast) var(--tv-ease), color var(--tv-dur-fast) var(--tv-ease);
}

.category-item:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

.category-item.active {
  background: color-mix(in srgb, var(--tv-primary) 12%, transparent);
  color: var(--tv-primary);
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
  border-radius: var(--tv-radius-full);
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-xs);
  line-height: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition: background var(--tv-dur-fast) var(--tv-ease), color var(--tv-dur-fast) var(--tv-ease);
}

.category-item:hover .item-count {
  background: var(--tv-surface-container-highest);
  color: var(--tv-on-surface);
}

.category-item.active .item-count {
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
}

.sidebar-note {
  margin: var(--tv-sm) 10px 2px;
  padding-top: var(--tv-sm);
  border-top: 1px solid var(--tv-outline-variant);
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  color: var(--tv-on-surface-variant);
}
</style>
