<template>
  <aside class="filter-sidebar">
    <!-- 当前技术与条目数：切技术后这里联动（smoke 用例断言 .tech-count） -->
    <div class="sidebar-caption">
      <span class="tech-label">{{ currentTechLabel }}</span>
      <span class="tech-count tv-num">{{ techExamplesCount }} 个示例</span>
    </div>

    <nav class="category-list">
      <button
        v-for="cat in categories"
        :key="cat.key"
        :class="['category-item', { active: current === cat.key }]"
        @click="$emit('select', cat.key)"
      >
        <span class="item-label">{{ cat.label }}</span>
        <span class="item-count tv-num">{{ cat.count }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
// 示例中心左侧筛选栏（当前技术 + 子分类列表）。
// 纯展示组件：状态由父组件的 useGalleryFilters 持有，选中只发事件。
defineProps({
  currentTechLabel: { type: String, default: '' },
  techExamplesCount: { type: Number, default: 0 },
  categories: { type: Array as PropType<Array<{ key: string; label: string; count?: number }>>, default: () => [] },
  current: { type: String, default: 'all' },
})

defineEmits(['select'])
</script>

<style scoped>
/* Sidebar */
.filter-sidebar {
  position: sticky;
  top: calc(var(--tv-top-nav-height) + var(--tv-lg));
  width: 232px;
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

/* Category list */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  position: relative;
}

.category-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--tv-primary);
  border-radius: 0 var(--tv-radius-full) var(--tv-radius-full) 0;
  transition: height var(--tv-dur) var(--tv-ease);
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

.category-item.active::before {
  height: 18px;
}

.item-label {
  flex: 1;
}

.item-count {
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
</style>
