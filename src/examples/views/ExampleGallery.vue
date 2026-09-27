<template>
  <div class="example-gallery-page">
    <!--
      页头：把「这是什么库 / 封存的是哪一版 / 有多大」三件事压缩到一屏顶部。
      原先这三段文案散在内容区左上，右侧只有一个孤零零的「共 N 个示例」，
      既看不出库的规模，也看不出它的可信度来源。
    -->
    <header class="gallery-hero">
      <div class="hero-inner">
        <div class="hero-text">
          <h1 class="hero-title">
            示例中心
          </h1>
          <p class="hero-subtitle">
            整合 threejs-lesson、three-cesium-examples 等优质 Three.js 示例
          </p>
          <!--
            示例中心是只读归档，那么「封存的是哪一版」就是它唯一能自证可信度的信息。
            原先全库没有任何时间/版本字段，也没登记过上游出处。
          -->
          <p class="hero-snapshot">
            {{ snapshotLine }}
          </p>
        </div>
        <!--
          统计从三个独立色块改为一行内联数字：它们是页头的佐证信息，
          不是需要各自占一个卡片的主体内容；一行排开与右侧缘对齐更稳。
        -->
        <p
          v-if="totalCount"
          class="hero-stats tv-num"
        >
          <span class="hero-stat-num">{{ totalCount }}</span> 个示例
          <span
            class="hero-stat-dot"
            aria-hidden="true"
          >·</span>
          <span class="hero-stat-num">{{ sourceCount }}</span> 个来源
          <span
            class="hero-stat-dot"
            aria-hidden="true"
          >·</span>
          <span class="hero-stat-num">{{ topicCount }}</span> 个专题
        </p>
      </div>
    </header>

    <main class="gallery-main">
      <!-- 筛选面板：只保留专题分类一个维度（技术栈/数据源已于 2026-09-27 裁剪） -->
      <GalleryFilterSidebar
        :current-sub-category="currentSubCategory"
        :sub-facets="subFacets"
        @select="selectCategory"
      />

      <!-- Main Content -->
      <section class="content-area">
        <!--
          工具条粘在顶栏下方：1417 条要翻 30 页，改排序/换视图不该要求用户先滚回顶部。
          粘性定位依赖 #app 是滚动根（见 useGalleryFilters.galleryScrollRoot 注释）。
        -->
        <div class="content-sticky">
          <GalleryToolbar
            :count="filteredExamples.length"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :sort="sort"
            :view="view"
            :density="density"
            :page-size="pageSize"
            @update:sort="setSort"
            @update:view="setView"
            @update:density="setDensity"
            @update:page-size="setPageSize"
          />
          <GalleryActiveFilters
            :filters="activeFilters"
            @clear="clearFilter"
            @clear-all="clearAllFilters"
          />
        </div>

        <!-- 注册表 11 个分片是懒加载的，落地前先占位，避免整页布局跳一下 -->
        <div
          v-if="loading"
          class="card-grid"
          :class="gridClass"
        >
          <div
            v-for="i in 12"
            :key="i"
            class="card-skeleton"
          />
        </div>

        <template v-else>
          <div
            v-if="filteredExamples.length > 0"
            class="card-grid"
            :class="gridClass"
          >
            <ExampleCard
              v-for="ex in paginatedExamples"
              :key="`${ex.source}-${ex.category}-${ex.id}`"
              :ex="ex"
              :view="view"
              :dense="isDense"
            />
          </div>

          <!--
            空态要回答「为什么空」和「怎么退出」，只写「暂无匹配示例」等于把用户晾着。
            这里把当前条件重述一遍并给一个直接清空的出口。
          -->
          <div
            v-else
            class="empty-state"
          >
            <span class="empty-icon">
              <UiIcon
                name="compass"
                :size="30"
              />
            </span>
            <h2 class="empty-title">
              没有符合条件的示例
            </h2>
            <p class="empty-desc">
              <template v-if="activeFilters.length">
                当前条件：{{ activeFilters.map(f => `${f.label}「${f.value}」`).join(' + ') }}
              </template>
              <template v-else>
                示例库正在加载或为空
              </template>
            </p>
            <div class="empty-actions">
              <button
                type="button"
                class="empty-btn"
                @click="clearAllFilters"
              >
                清除全部条件
              </button>
              <button
                type="button"
                class="empty-btn ghost"
                @click="setSort('default')"
              >
                恢复推荐顺序
              </button>
            </div>
            <p class="empty-hint">
              试试更短的词，或直接按「数据源」浏览 —— 11 个来源各自是一套完整教程。
            </p>
          </div>

          <GalleryPagination
            :current="currentPage"
            :total-pages="totalPages"
            :pages="visiblePages"
            @update:current="goToPage"
          />
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 筛选状态机（URL ↔ 状态同步、分面计数、排序、分页）已抽到 useGalleryFilters，
// 本组件只负责渲染。改动过滤逻辑请改 composable，别在这里加分支。
import { computed } from 'vue'
import { useGalleryFilters } from '../composables/useGalleryFilters'
import { subCategoryDefinitions } from '../composables/useExampleFilters'
import { snapshotSummary } from '../registry/provenance'
import UiIcon from '../../components/UiIcon'
import ExampleCard from './ExampleCard.vue'
import GalleryFilterSidebar from './GalleryFilterSidebar.vue'
import GalleryToolbar from './GalleryToolbar.vue'
import GalleryActiveFilters from './GalleryActiveFilters.vue'
import GalleryPagination from './GalleryPagination.vue'

const snapshotLine = snapshotSummary()

const {
  currentSubCategory,
  currentPage,
  pageSize,
  sort,
  view,
  density,
  loading,
  totalCount,
  sourceCount,
  subFacets,
  filteredExamples,
  paginatedExamples,
  totalPages,
  visiblePages,
  activeFilters,
  selectCategory,
  setSort,
  setPageSize,
  setView,
  setDensity,
  clearFilter,
  clearAllFilters,
  goToPage,
} = useGalleryFilters()

/** 专题数是个常量（分类定义在 useExampleFilters），不随筛选变化 */
const topicCount = subCategoryDefinitions.length - 1

const isDense = computed(() => density.value === 'compact')

/**
 * 网格列数用 auto-fill 而不是写死断点：侧栏占了 260px，内容区宽度随视口非线性变化，
 * 写死 4 列在 1024~1280 之间会把卡片压到 200px 以下。auto-fill 保证永远不溢出，
 * 紧凑密度把最小列宽从 262px 降到 180px，一屏多出近一倍条目。
 */
const gridClass = computed(() => {
  if (view.value === 'list') return ['is-list', isDense.value ? 'is-dense' : '']
  return ['is-grid', isDense.value ? 'is-dense' : '']
})

const rangeStart = computed(() =>
  filteredExamples.value.length === 0
    ? 0
    : (currentPage.value - 1) * pageSize.value + 1,
)
const rangeEnd = computed(() =>
  Math.min(filteredExamples.value.length, currentPage.value * pageSize.value),
)
</script>

<style scoped>
.example-gallery-page {
  min-height: calc(100vh - var(--tv-top-nav-height));
  padding-top: var(--tv-top-nav-height);
  background-color: var(--tv-background);
  color: var(--tv-on-background);
}

/* ── 页头 ──────────────────────────────────────────────────────── */
.gallery-hero {
  border-bottom: 1px solid var(--tv-outline-variant);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--tv-primary) 6%, var(--tv-background)),
    var(--tv-background) 70%
  );
}

.hero-inner {
  max-width: 1600px;
  margin: 0 auto;
  /* 页头只承担「这是什么 / 有多大」两句话的高度，垂直内衬压到 16px，
     让用户第一屏就看到筛选栏和卡片 */
  padding: var(--tv-md) var(--tv-lg);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--tv-xs) var(--tv-md);
}

.hero-text {
  min-width: 0;
}

.hero-title {
  font-size: var(--tv-fs-2xl);
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--tv-on-surface);
  margin-bottom: 4px;
}

.hero-subtitle {
  font-size: var(--tv-fs-md);
  line-height: 22px;
  color: var(--tv-on-surface-variant);
}

.hero-snapshot {
  margin-top: 2px;
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  color: var(--tv-on-surface-variant);
  opacity: 0.8;
}

.hero-stats {
  margin: 0;
  padding-bottom: 2px;
  font-size: var(--tv-fs-sm);
  line-height: 20px;
  color: var(--tv-on-surface-variant);
  white-space: nowrap;
}

.hero-stat-num {
  font-size: var(--tv-fs-lg);
  line-height: 20px;
  font-weight: 700;
  color: var(--tv-on-surface);
}

.hero-stat-dot {
  margin: 0 var(--tv-sm);
  opacity: 0.6;
}

/* ── 主体 ──────────────────────────────────────────────────────── */
.gallery-main {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--tv-lg);
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--tv-md) var(--tv-lg) var(--tv-xl);
}

.content-area {
  flex: 1;
  min-width: 0;
}

.content-sticky {
  position: sticky;
  top: var(--tv-top-nav-height);
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: var(--tv-sm);
  padding: var(--tv-sm) 0;
  margin-bottom: var(--tv-md);
  /* 半透明 + 背景模糊：卡片从工具条下滚过时是「穿过毛玻璃」而不是被硬边切断；
     86% 不透明度保证下面的内容不会透过文字区干扰读数 */
  background: color-mix(in srgb, var(--tv-background) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--tv-outline-variant) 60%, transparent);
}

/* Card grid */
.card-grid {
  display: grid;
  gap: 20px;
  margin-bottom: var(--tv-lg);
}

.card-grid.is-grid {
  grid-template-columns: repeat(auto-fill, minmax(262px, 1fr));
}

.card-grid.is-grid.is-dense {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--tv-sm);
}

.card-grid.is-list {
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: var(--tv-sm);
}

.card-grid.is-list.is-dense {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 6px;
}

/* 骨架屏：刻意不复用 .example-card —— 那是 E2E 断言「每页 48 条」的选择器 */
.card-skeleton {
  border-radius: var(--tv-radius-xl);
  border: 1px solid color-mix(in srgb, var(--tv-outline-variant) 30%, transparent);
  background: var(--tv-surface-container-low);
  min-height: 260px;
  animation: skeleton-pulse 1.4s var(--tv-ease) infinite;
}

.is-dense .card-skeleton {
  min-height: 130px;
}

.is-list .card-skeleton {
  min-height: 116px;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (prefers-reduced-motion: reduce) {
  .card-skeleton {
    animation: none;
  }
}

/* ── 空态 ──────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--tv-sm);
  padding: var(--tv-xl) var(--tv-lg);
  border-radius: var(--tv-radius-xl);
  border: 1px dashed var(--tv-outline-variant);
  background: var(--tv-surface-container-lowest);
  margin-bottom: var(--tv-lg);
}

.empty-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  color: var(--tv-primary);
  background: color-mix(in srgb, var(--tv-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tv-primary) 22%, transparent);
}

.empty-title {
  font-size: var(--tv-fs-lg);
  line-height: 26px;
  font-weight: 600;
  color: var(--tv-on-surface);
}

.empty-desc {
  font-size: var(--tv-fs-md);
  line-height: 22px;
  color: var(--tv-on-surface-variant);
  max-width: 620px;
  word-break: break-word;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--tv-sm);
  margin-top: 2px;
}

.empty-btn {
  padding: 7px 16px;
  border-radius: var(--tv-radius-full);
  border: 1px solid transparent;
  background: var(--tv-primary-container);
  color: var(--tv-on-primary-container);
  font-family: inherit;
  font-size: var(--tv-fs-sm);
  line-height: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: filter var(--tv-dur-fast) var(--tv-ease);
}

.empty-btn:hover {
  filter: brightness(1.06);
}

.empty-btn.ghost {
  background: transparent;
  border-color: var(--tv-outline-variant);
  color: var(--tv-on-surface-variant);
  font-weight: 500;
}

.empty-btn.ghost:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

.empty-hint {
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  color: var(--tv-on-surface-variant);
  opacity: 0.85;
  max-width: 560px;
}
</style>
