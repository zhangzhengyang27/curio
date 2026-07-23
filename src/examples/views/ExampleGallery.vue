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
          <h3 class="section-label">分类</h3>
          <nav class="category-list">
            <button
              v-for="cat in availableSubCategories"
              :key="cat.key"
              :class="['category-item', { active: currentSubCategory === cat.key }]"
              @click="currentSubCategory = cat.key"
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
            <h1 class="content-title">示例中心</h1>
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
            @click="currentTech = t.key"
          >
            <span class="tech-tab-label">{{ t.label }}</span>
            <span class="tech-tab-count">{{ t.count }}</span>
          </button>
        </div>

        <div class="card-grid">
          <router-link
            v-for="ex in paginatedExamples"
            :key="`${ex.source}-${ex.category}-${ex.id}`"
            :to="`/examples/${ex.source}/${ex.category}/${ex.id}`"
            class="example-card"
          >
            <div class="card-media">
              <img
                v-if="thumbOk(ex)"
                :src="ex.thumbnail"
                :alt="ex.title"
                loading="lazy"
                @error="onThumbError(ex)"
              >
              <div
                v-else
                class="thumb-placeholder"
                :style="{ '--thumb-gradient': placeholderGradient(ex) }"
              >
                <span class="thumb-emoji">{{ ex.icon || '🧊' }}</span>
              </div>
              <div class="card-play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <span class="source-badge">{{ sourceLabel(ex.source) }}</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ ex.title }}</h3>
              <p class="card-desc">{{ ex.description || ex.title }}</p>
              <div class="card-tags">
                <span
                  v-for="tag in ex.tags.slice(0, 3)"
                  :key="tag"
                  class="card-tag"
                >{{ tag }}</span>
              </div>
            </div>
          </router-link>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            :disabled="currentPage === 1"
            class="page-btn"
            @click="currentPage--"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAllExamples, getSources } from '../registry/index.js'
import { techGroups, subCategoryDefinitions } from '../composables/useExampleFilters.js'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.search || '')
const currentTech = ref('all')
const currentSubCategory = ref('all')
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 16

const allExamples = computed(() => getAllExamples())

const techTabs = computed(() => {
  return techGroups.map(t => {
    const count = t.key === 'all'
      ? allExamples.value.length
      : allExamples.value.filter(ex => t.match(ex)).length
    return { ...t, count }
  })
})

watch([keyword, currentSubCategory], () => {
  currentPage.value = 1
})

watch(currentTech, () => {
  currentSubCategory.value = 'all'
  currentPage.value = 1
})

function syncQueryToState() {
  const { tech, sub, search } = route.query
  const validTech = tech && techGroups.some(t => t.key === tech)
  const validSub = sub && subCategoryDefinitions.some(s => s.key === sub)
  if (validTech) currentTech.value = tech
  if (validSub) currentSubCategory.value = sub
  keyword.value = search || ''
  currentPage.value = Number(route.query.page) || 1
}

onMounted(syncQueryToState)
watch(() => route.query, syncQueryToState, { deep: true })

// 状态 -> URL：切换技术 / 分类 / 搜索时写回 query，刷新可保持、可分享、可前进后退
watch([currentTech, currentSubCategory, keyword, currentPage], () => {
  const query = {}
  if (currentTech.value !== 'all') query.tech = currentTech.value
  if (currentSubCategory.value !== 'all') query.sub = currentSubCategory.value
  const kw = keyword.value.trim()
  if (kw) query.search = kw
  if (currentPage.value > 1) query.page = currentPage.value
  router.replace({ query })
})

const currentTechInfo = computed(() => techGroups.find(t => t.key === currentTech.value))
const currentTechLabel = computed(() => currentTechInfo.value?.label || '全部技术')
const techExamplesCount = computed(() => {
  const match = currentTechInfo.value?.match || (() => true)
  return allExamples.value.filter(ex => match(ex)).length
})

const availableSubCategories = computed(() => {
  const tech = techGroups.find(t => t.key === currentTech.value)
  const techExamples = allExamples.value.filter(ex => tech.match(ex))

  const counts = new Map()
  counts.set('all', techExamples.length)

  techExamples.forEach(ex => {
    subCategoryDefinitions.forEach(sub => {
      if (sub.key !== 'all' && sub.match(ex)) {
        counts.set(sub.key, (counts.get(sub.key) || 0) + 1)
      }
    })
  })

  return subCategoryDefinitions
    .filter(sub => sub.key === 'all' || (counts.get(sub.key) || 0) > 0)
    .map(sub => ({ ...sub, count: counts.get(sub.key) || 0 }))
})

const filteredExamples = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const tech = techGroups.find(t => t.key === currentTech.value)
  const sub = subCategoryDefinitions.find(s => s.key === currentSubCategory.value)

  return allExamples.value.filter(ex => {
    const matchTech = tech.match(ex)
    const matchSub = sub.match(ex)
    const matchKw =
      !kw ||
      ex.title.toLowerCase().includes(kw) ||
      (ex.description && ex.description.toLowerCase().includes(kw)) ||
      ex.tags.some(tag => tag.toLowerCase().includes(kw))
    return matchTech && matchSub && matchKw
  })
})

const totalPages = computed(() => Math.ceil(filteredExamples.value.length / pageSize))
const paginatedExamples = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredExamples.value.slice(start, start + pageSize)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const current = currentPage.value
  let start = Math.max(2, current - 2)
  let end = Math.min(total - 1, current + 2)

  if (current <= 3) {
    end = 5
  } else if (current >= total - 2) {
    start = total - 4
  }

  const pages = [1]
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
})

const sources = computed(() => [{ source: 'all', label: '全部' }, ...getSources()])

function sourceLabel(source) {
  const found = sources.value.find(s => s.source === source)
  return found ? found.label : source
}

const gradients = [
  'linear-gradient(135deg, #0057c2 0%, #50dcff 100%)',
  'linear-gradient(135deg, #00687b 0%, #48d7f9 100%)',
  'linear-gradient(135deg, #9e3d00 0%, #ffb695 100%)',
  'linear-gradient(135deg, #0057c2 0%, #afc6ff 100%)',
  'linear-gradient(135deg, #00687b 0%, #afecff 100%)',
  'linear-gradient(135deg, #181c22 0%, #414755 100%)',
]

function placeholderGradient(ex) {
  const idx = (ex.title.length + ex.category.length) % gradients.length
  return gradients[idx]
}

// 缩略图加载失败(文件缺失/网络错误)时回退到占位符，避免破图
const failedThumbs = ref(new Set())
function thumbKey(ex) {
  return `${ex.source}/${ex.category}/${ex.id}`
}
function thumbOk(ex) {
  return !!ex.thumbnail && !failedThumbs.value.has(thumbKey(ex))
}
function onThumbError(ex) {
  failedThumbs.value.add(thumbKey(ex))
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
  flex-direction: column;
  gap: var(--tv-xs);
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

.section-label {
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tv-on-surface-variant);
  margin-bottom: var(--tv-sm);
  padding: 0 var(--tv-sm);
}

.section-icon {
  width: 16px;
  height: 16px;
  color: var(--tv-primary);
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

.example-card {
  display: flex;
  flex-direction: column;
  background: var(--tv-surface-container-lowest);
  border: 1px solid color-mix(in srgb, var(--tv-outline-variant) 30%, transparent);
  border-radius: var(--tv-radius-xl);
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.example-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--tv-primary) 15%, rgba(0, 0, 0, 0.08));
  border-color: color-mix(in srgb, var(--tv-primary-container) 40%, transparent);
}

.example-card:hover .card-title {
  color: var(--tv-primary);
}

.example-card:hover .card-play {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--tv-surface-container-low);
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.example-card:hover .card-media img {
  transform: scale(1.05);
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--thumb-gradient);
  transition: transform 0.5s ease;
}

.example-card:hover .thumb-placeholder {
  transform: scale(1.05);
}

.thumb-emoji {
  font-size: 48px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.card-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  background: rgba(0, 0, 0, 0.6);
  color: var(--tv-secondary-fixed);
  border: 1px solid color-mix(in srgb, var(--tv-secondary-fixed) 30%, transparent);
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.card-play svg {
  width: 24px;
  height: 24px;
}

.source-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: var(--tv-radius-sm);
  background: rgba(0, 0, 0, 0.6);
  color: var(--tv-secondary-fixed);
  border: 1px solid color-mix(in srgb, var(--tv-secondary-fixed) 30%, transparent);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--tv-md);
}

.card-title {
  font-size: 18px;
  line-height: 26px;
  font-weight: 500;
  color: var(--tv-on-surface);
  margin-bottom: var(--tv-xs);
  transition: color 0.2s;
}

.card-desc {
  flex: 1;
  font-size: 14px;
  line-height: 22px;
  color: var(--tv-on-surface-variant);
  margin-bottom: var(--tv-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  gap: var(--tv-xs);
  flex-wrap: wrap;
  margin-top: auto;
}

.card-tag {
  padding: 2px 8px;
  border-radius: var(--tv-radius-sm);
  background: color-mix(in srgb, var(--tv-secondary-container) 20%, transparent);
  color: var(--tv-on-secondary-container);
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
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
