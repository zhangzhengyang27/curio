<template>
  <div class="example-gallery-page">
    <main class="gallery-main">
      <!-- Sidebar Filters -->
      <GalleryFilterSidebar
        :current-tech-label="currentTechLabel"
        :tech-examples-count="techExamplesCount"
        :categories="availableSubCategories"
        :current="currentSubCategory"
        @select="selectCategory"
      />

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
          <div class="result-count tv-num">
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
        <GalleryPagination
          :current="currentPage"
          :total-pages="totalPages"
          :pages="visiblePages"
          @update:current="goToPage"
        />

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

<script setup lang="ts">
// 筛选状态机（URL ↔ 状态同步、过滤、分页）已抽到 useGalleryFilters，
// 本组件只负责渲染。改动过滤逻辑请改 composable，别在这里加分支。
import { useGalleryFilters } from '../composables/useGalleryFilters'
import ExampleCard from './ExampleCard.vue'
import GalleryFilterSidebar from './GalleryFilterSidebar.vue'
import GalleryPagination from './GalleryPagination.vue'

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

// 分页器是纯展示组件，只派发页码；这里显式写回 state（不在模板里直接改 ref）
function goToPage(page: number) {
  currentPage.value = page
}
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
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--tv-lg);
}


/* Content area */
.content-area {
  flex: 1;
  min-width: 0;
  padding: var(--tv-lg) 0 var(--tv-xl);
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
  font-size: var(--tv-fs-3xl);
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--tv-on-surface);
  margin-bottom: var(--tv-xs);
}

.content-subtitle {
  font-size: var(--tv-fs-md);
  line-height: 22px;
  color: var(--tv-on-surface-variant);
}

.result-count {
  font-size: var(--tv-fs-sm);
  line-height: 20px;
  font-weight: 500;
  color: var(--tv-on-surface-variant);
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
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-md);
  line-height: 22px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--tv-dur-fast) var(--tv-ease), color var(--tv-dur-fast) var(--tv-ease),
    border-color var(--tv-dur-fast) var(--tv-ease);
}

.tech-tab:hover {
  background: var(--tv-surface-container);
  color: var(--tv-on-surface);
}

.tech-tab.active {
  background: var(--tv-primary-container);
  border-color: transparent;
  color: var(--tv-on-primary-container);
  font-weight: 600;
}

.tech-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: var(--tv-radius-full);
  background: color-mix(in srgb, var(--tv-on-surface-variant) 15%, transparent);
  font-size: var(--tv-fs-xs);
  line-height: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.tech-tab.active .tech-tab-count {
  background: color-mix(in srgb, var(--tv-on-primary-container) 18%, transparent);
  color: var(--tv-on-primary-container);
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


.empty-tip {
  text-align: center;
  padding: var(--tv-xl) 0;
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-md);
}

</style>
