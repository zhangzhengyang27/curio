<template>
  <aside class="filter-sidebar">
    <div class="sidebar-header">
      <span class="tech-badge">{{ currentTechLabel }}</span>
      <span class="tech-count">{{ techExamplesCount }} 个示例</span>
    </div>

    <div class="filter-section">
      <nav class="category-list">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['category-item', { active: current === cat.key }]"
          @click="$emit('select', cat.key)"
        >
          <span class="item-label">{{ cat.label }}</span>
          <span class="item-count">{{ cat.count }}</span>
        </button>
      </nav>
    </div>
  </aside>
</template>

<script setup>
// 示例中心左侧筛选栏（技术标签 + 子分类列表）。
// 纯展示组件：状态由父组件的 useGalleryFilters 持有，选中只发事件。
defineProps({
  currentTechLabel: { type: String, default: '' },
  techExamplesCount: { type: Number, default: 0 },
  categories: { type: Array, default: () => [] },
  current: { type: String, default: 'all' },
})

defineEmits(['select'])
</script>

<style scoped>
/* Sidebar */
.filter-sidebar {
  position: sticky;
  top: calc(var(--tv-top-nav-height) + var(--tv-lg));
  width: 240px;
  flex-shrink: 0;
  max-height: calc(100vh - var(--tv-top-nav-height) - var(--tv-lg) * 2);
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--tv-lg);
  margin-left: var(--tv-xs);
  background: var(--tv-surface-container-lowest);
  border: 1px solid var(--tv-outline);
  border-radius: var(--tv-radius-2xl);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px color-mix(in srgb, var(--tv-surface) 50%, transparent);
}

.filter-sidebar::-webkit-scrollbar {
  width: 4px;
}

.filter-sidebar::-webkit-scrollbar-thumb {
  background: var(--tv-outline-variant);
  border-radius: var(--tv-radius-full);
}

.filter-section {
  margin-bottom: var(--tv-md);
}

.filter-section:last-child {
  margin-bottom: 0;
}

/* Sidebar header */
.sidebar-header {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--tv-sm);
  padding: var(--tv-md);
  margin-bottom: var(--tv-lg);
  background: linear-gradient(135deg, color-mix(in srgb, var(--tv-primary) 12%, transparent) 0%, color-mix(in srgb, var(--tv-primary) 4%, transparent) 100%);
  border: 1px solid color-mix(in srgb, var(--tv-primary) 15%, transparent);
  border-radius: var(--tv-radius-xl);
}

.tech-badge {
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--tv-primary);
}

.tech-count {
  font-size: 12px;
  line-height: 18px;
  color: var(--tv-on-surface-variant);
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
  padding: 10px 12px;
  border-radius: var(--tv-radius-lg);
  border: none;
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
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
  transition: height 0.2s ease;
}

.category-item:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

.category-item.active {
  background: color-mix(in srgb, var(--tv-primary) 10%, transparent);
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
  border-radius: var(--tv-radius-md);
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface-variant);
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.category-item:hover .item-count {
  background: var(--tv-surface-container-highest);
  color: var(--tv-on-surface);
}

.category-item.active .item-count {
  background: var(--tv-primary);
  color: var(--tv-on-primary);
}

/* Dark mode overrides */
html.dark .sidebar-header {
  background: linear-gradient(135deg, color-mix(in srgb, var(--tv-secondary-fixed) 15%, transparent) 0%, color-mix(in srgb, var(--tv-secondary-fixed) 5%, transparent) 100%);
  border-color: color-mix(in srgb, var(--tv-secondary-fixed) 20%, transparent);
}

html.dark .tech-badge {
  color: var(--tv-secondary-fixed);
}

html.dark .category-item:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

html.dark .category-item.active {
  background: color-mix(in srgb, var(--tv-secondary-fixed) 15%, transparent);
  color: var(--tv-secondary-fixed);
}

html.dark .category-item::before {
  background: var(--tv-secondary-fixed);
}

html.dark .category-item.active .item-count {
  background: var(--tv-secondary-fixed);
  color: var(--tv-on-secondary-fixed);
}
</style>
