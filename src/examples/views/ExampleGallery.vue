<template>
  <div class="example-gallery-page">
    <main class="gallery-main">
      <!-- Sidebar Filters -->
      <aside class="filter-sidebar">
        <div class="sidebar-header">
          <span class="tech-badge">{{ currentTechLabel }}</span>
          <span class="tech-count">{{ techExamplesCount }} 个示例</span>
        </div>

        <div class="filter-section">
          <nav class="category-list">
            <button
              v-for="cat in availableSubCategories"
              :key="cat.key"
              :class="['category-item', { active: currentSubCategory === cat.key }]"
              @click="selectCategory(cat.key)"
            >
              <span class="item-label">{{ cat.label }}</span>
              <span class="item-count">{{ cat.count }}</span>
            </button>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <section class="content-area">
        <header class="content-header">
          <div>
            <h1 class="content-title">
              示例中心
            </h1>
            <p class="content-subtitle">
              整合 threejs-lesson、three-cesium-examples 等优质 Three.js 示例
            </p>
          </div>
          <div class="result-count">
            共 {{ filteredExamples.length }} 个示例
          </div>
        </header>

        <!-- 技术切换器 -->
        <div class="tech-tabs">
          <button
            v-for="t in techTabs"
            :key="t.key"
            :class="['tech-tab', { active: currentTech === t.key }]"
            @click="selectTech(t.key)"
          >
            <span class="tech-tab-label">{{ t.label }}</span>
            <span class="tech-tab-count">{{ t.count }}</span>
          </button>
        </div>

        <div class="card-grid">
          <ExampleCard
            v-for="ex in paginatedExamples"
            :key="`${ex.source}-${ex.category}-${ex.id}`"
            :ex="ex"
          />
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="pagination"
        >
          <button
            :disabled="currentPage === 1"
            class="page-btn"
            @click="currentPage--"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            v-for="(page, idx) in visiblePages"
            :key="`${page}-${idx}`"
            :class="['page-btn', { active: currentPage === page, ellipsis: page === '...' }]"
            :disabled="page === '...'"
            @click="page !== '...' && (currentPage = page)"
          >
            {{ page }}
          </button>
          <button
            :disabled="currentPage === totalPages"
            class="page-btn"
            @click="currentPage++"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div
          v-if="filteredExamples.length === 0"
          class="empty-tip"
        >
          暂无匹配示例
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
// 筛选状态机（URL ↔ 状态同步、过滤、分页）已抽到 useGalleryFilters，
// 本组件只负责渲染。改动过滤逻辑请改 composable，别在这里加分支。
import { useGalleryFilters } from '../composables/useGalleryFilters.js'
import ExampleCard from './ExampleCard.vue'

const {
  currentTech,
  currentSubCategory,
  currentPage,
  currentTechLabel,
  techExamplesCount,
  techTabs,
  availableSubCategories,
  filteredExamples,
  paginatedExamples,
  totalPages,
  visiblePages,
  selectTech,
  selectCategory,
} = useGalleryFilters()
</script>

<style scoped>
.example-gallery-page {
  min-height: calc(100vh - var(--tv-top-nav-height));
  padding-top: var(--tv-top-nav-height);
  background-color: var(--tv-background);
  color: var(--tv-on-background);
}

.gallery-main {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--tv-lg);
}

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

/* Content area */
.content-area {
  flex: 1;
  min-width: 0;
  padding: var(--tv-lg) var(--tv-margin) var(--tv-lg) 0;
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: var(--tv-sm);
  margin-bottom: var(--tv-lg);
}

@media (min-width: 640px) {
  .content-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.content-title {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--tv-on-surface);
  margin-bottom: var(--tv-xs);
}

.content-subtitle {
  font-size: 14px;
  line-height: 22px;
  color: var(--tv-on-surface-variant);
}

.result-count {
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--tv-outline);
  white-space: nowrap;
}

/* Tech tabs */
.tech-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tv-sm);
  margin-bottom: var(--tv-lg);
}

.tech-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--tv-radius-full);
  border: 1px solid var(--tv-outline-variant);
  background: var(--tv-surface-container-low);
  color: var(--tv-on-surface-variant);
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.tech-tab:hover {
  background: var(--tv-surface-container);
  color: var(--tv-on-surface);
}

.tech-tab.active {
  background: var(--tv-primary);
  border-color: var(--tv-primary);
  color: var(--tv-on-primary);
  font-weight: 600;
}

.tech-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--tv-radius-md);
  background: color-mix(in srgb, var(--tv-on-surface-variant) 15%, transparent);
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
}

.tech-tab.active .tech-tab-count {
  background: color-mix(in srgb, var(--tv-on-primary) 22%, transparent);
  color: var(--tv-on-primary);
}

html.dark .tech-tab.active {
  background: var(--tv-secondary-fixed);
  border-color: var(--tv-secondary-fixed);
  color: var(--tv-on-secondary-fixed);
}

html.dark .tech-tab.active .tech-tab-count {
  background: color-mix(in srgb, var(--tv-on-secondary-fixed) 22%, transparent);
  color: var(--tv-on-secondary-fixed);
}

/* Card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--tv-md);
  margin-bottom: var(--tv-lg);
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--tv-xs);
  margin-top: var(--tv-lg);
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: var(--tv-radius-lg);
  border: 1px solid var(--tv-outline-variant);
  background: var(--tv-surface-container-low);
  color: var(--tv-on-surface-variant);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn svg {
  width: 18px;
  height: 18px;
}

.page-btn:hover:not(:disabled) {
  background: var(--tv-surface-container);
  color: var(--tv-on-surface);
}

.page-btn.active {
  background: color-mix(in srgb, var(--tv-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--tv-primary) 30%, transparent);
  color: var(--tv-primary);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border-color: transparent;
  background: transparent;
  cursor: default;
  min-width: 24px;
  padding: 0;
}

.empty-tip {
  text-align: center;
  padding: var(--tv-xl) 0;
  color: var(--tv-on-surface-variant);
  font-size: 14px;
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

html.dark .example-card:hover .card-title {
  color: var(--tv-secondary-fixed);
}

html.dark .example-card:hover {
  border-color: color-mix(in srgb, var(--tv-secondary-fixed) 40%, transparent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--tv-secondary-fixed) 12%, rgba(0, 0, 0, 0.2));
}

html.dark .page-btn.active {
  background: var(--tv-secondary-container);
  border-color: var(--tv-secondary-container);
  color: var(--tv-on-secondary-container);
}
</style>
