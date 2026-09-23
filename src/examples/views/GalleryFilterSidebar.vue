<template>
  <aside class="filter-sidebar">
    <!-- 当前技术与条目数：切技术后这里联动（smoke 用例断言 .tech-count） -->
    <div class="sidebar-caption">
      <span class="tech-label">{{ currentTechLabel }}</span>
      <span class="tech-count tv-num">{{ techExamplesCount }} 个示例</span>
    </div>

    <GalleryFilterSection
      title="技术栈"
      :count="techTabs.length - 1"
      :selected="techSelected"
    >
      <button
        v-for="t in techTabs"
        :key="t.key"
        type="button"
        :class="['tech-tab', { active: currentTech === t.key }]"
        @click="$emit('select-tech', t.key)"
      >
        <span class="tech-tab-label">{{ t.label }}</span>
        <span class="tech-tab-count tv-num">{{ t.count }}</span>
      </button>
    </GalleryFilterSection>

    <!--
      数据源是 2026-09-23 补的第三个维度。此前 11 个来源在界面上完全没有入口，
      只能靠标题里的中文碰运气 —— 而「WebGL 基础」这类来源名根本不进标题。

      默认只展开条目最多的 6 个：三个分区加起来 36 行远超一屏，全量平铺会把
      专题分类推出视野。被选中的项永远保留在列表里（即使它在折叠的尾部）。
    -->
    <GalleryFilterSection
      title="数据源"
      :count="sourceFacets.length - 1"
      :selected="sourceSelected"
    >
      <button
        v-for="s in visibleSources"
        :key="s.key"
        type="button"
        :class="['source-item', { active: currentSource === s.key }]"
        @click="$emit('select-source', s.key)"
      >
        <span class="item-label">{{ s.label }}</span>
        <span class="item-count tv-num">{{ s.count }}</span>
      </button>
      <button
        v-if="hiddenSources > 0"
        type="button"
        class="source-toggle"
        @click="sourceExpanded = !sourceExpanded"
      >
        {{ sourceExpanded ? '收起' : `展开其余 ${hiddenSources} 个来源` }}
      </button>
    </GalleryFilterSection>

    <GalleryFilterSection
      title="专题分类"
      :count="subFacets.length - 1"
      :selected="subSelected"
    >
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
    </GalleryFilterSection>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import GalleryFilterSection from './GalleryFilterSection.vue'
import type { GalleryFacet } from '../composables/useGalleryFilters'
// 示例中心左侧筛选面板：技术栈 → 数据源 → 专题分类，三个维度自上而下。
// 纯展示组件：状态由父组件的 useGalleryFilters 持有，选中只发事件。
//
// ⚠ class 名是 E2E 契约，不要顺手改：
//   .tech-tab / .tech-tab-count / .tech-tab.active      （技术栈）
//   .category-item / .item-label / .item-count          （专题分类，仅此一处）
//   .tech-count                                          （侧栏顶部当前技术条目数）
// 数据源刻意用 .source-item 而不是复用 .category-item —— 否则
// tests/smoke.spec.ts 里 `.category-item` 的第 2 项会指到来源上去。
const props = defineProps({
  currentTechLabel: { type: String, default: '' },
  techExamplesCount: { type: Number, default: 0 },
  currentTech: { type: String, default: 'all' },
  currentSource: { type: String, default: 'all' },
  currentSubCategory: { type: String, default: 'all' },
  techTabs: { type: Array as PropType<GalleryFacet[]>, default: () => [] },
  sourceFacets: { type: Array as PropType<GalleryFacet[]>, default: () => [] },
  subFacets: { type: Array as PropType<GalleryFacet[]>, default: () => [] },
})

const countSum = computed(() =>
  props.subFacets.reduce((sum, c) => (c.key === 'all' ? sum : sum + (c.count || 0)), 0),
)
const overlapping = computed(() => countSum.value > (props.subFacets[0]?.count ?? 0))

/* ── 分区标题上的「已选」角标 ───────────────────────────────────── */
const techSelected = computed(() =>
  props.currentTech === 'all' ? '' : (props.techTabs.find(t => t.key === props.currentTech)?.label || ''),
)
const sourceSelected = computed(() =>
  props.currentSource === 'all'
    ? ''
    : (props.sourceFacets.find(s => s.key === props.currentSource)?.label || props.currentSource),
)
const subSelected = computed(() =>
  props.currentSubCategory === 'all' ? '' : (props.subFacets.find(s => s.key === props.currentSubCategory)?.label || ''),
)

/* ── 数据源列表的默认折叠 ──────────────────────────────────────── */
const SOURCE_LIMIT = 6
const sourceExpanded = ref(false)
const visibleSources = computed(() => {
  const [allFacet, ...rest] = props.sourceFacets
  if (sourceExpanded.value || rest.length <= SOURCE_LIMIT) return props.sourceFacets
  const head = rest.slice(0, SOURCE_LIMIT)
  const selectedIdx = rest.findIndex(s => s.key === props.currentSource)
  // 选中的项被折叠进尾部时必须保留，否则用户会以为条件丢了
  if (selectedIdx >= SOURCE_LIMIT) head[head.length - 1] = rest[selectedIdx]
  return [allFacet, ...head]
})
const hiddenSources = computed(() => props.sourceFacets.length - visibleSources.value.length)

defineEmits(['select', 'select-tech', 'select-source'])
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

.filter-sidebar::-webkit-scrollbar-thumb {
  background: var(--tv-outline-variant);
  border-radius: var(--tv-radius-full);
}

/* 当前技术行：单行弱化呈现，不做色块头部 */
.sidebar-caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--tv-sm);
  padding: 8px 10px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--tv-outline-variant);
}

.tech-label {
  font-size: var(--tv-fs-md);
  font-weight: 600;
  color: var(--tv-on-surface);
}

.tech-count {
  font-size: var(--tv-fs-xs);
  color: var(--tv-on-surface-variant);
  white-space: nowrap;
}

/* 三个分区共用的行样式 */
.tech-tab,
.source-item,
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

.tech-tab:hover,
.source-item:hover,
.category-item:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

.tech-tab.active,
.source-item.active,
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

.tech-tab-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tech-tab-count,
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

.tech-tab:hover .tech-tab-count,
.source-item:hover .item-count,
.category-item:hover .item-count {
  background: var(--tv-surface-container-highest);
  color: var(--tv-on-surface);
}

.tech-tab.active .tech-tab-count,
.source-item.active .item-count,
.category-item.active .item-count {
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
}

.sidebar-note {
  margin: var(--tv-sm) 10px 0;
  padding-top: var(--tv-sm);
  border-top: 1px solid var(--tv-outline-variant);
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  color: var(--tv-on-surface-variant);
}

.source-toggle {
  width: 100%;
  margin-top: 2px;
  padding: 6px 12px;
  border: none;
  border-radius: var(--tv-radius-md);
  background: transparent;
  color: var(--tv-primary);
  font-family: inherit;
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  text-align: left;
  cursor: pointer;
  transition: background var(--tv-dur-fast) var(--tv-ease);
}

.source-toggle:hover {
  background: var(--tv-surface-container-high);
}

.source-toggle:focus-visible {
  outline: 2px solid var(--tv-primary);
  outline-offset: 1px;
}
</style>
