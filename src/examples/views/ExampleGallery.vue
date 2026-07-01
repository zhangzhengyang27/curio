<template>
  <div class="gallery">
    <h1>示例中心</h1>
    <p class="subtitle">
      整合 threejs-lesson、three-cesium-examples 等优质 Three.js 示例
    </p>

    <div class="toolbar">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索示例..."
      >

      <div class="filter-row">
        <span class="filter-label">来源</span>
        <div class="filter-tabs">
          <button
            v-for="src in sources"
            :key="src.source"
            :class="['tab', { active: currentSource === src.source }]"
            @click="currentSource = src.source"
          >
            {{ src.label }}
          </button>
        </div>
      </div>

      <div
        v-if="subCategories.length > 1"
        class="filter-row"
      >
        <span class="filter-label">分类</span>
        <div class="filter-tabs">
          <button
            v-for="cat in subCategories"
            :key="cat.key"
            :class="['tab', { active: currentCategory === cat.key }]"
            @click="currentCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid">
      <router-link
        v-for="ex in filteredExamples"
        :key="`${ex.source}-${ex.category}-${ex.id}`"
        :to="`/examples/${ex.source}/${ex.category}/${ex.id}`"
        class="card"
      >
        <div class="card-thumb">
          <img
            v-if="ex.thumbnail"
            :src="ex.thumbnail"
            :alt="ex.title"
            loading="lazy"
          >
          <div
            v-else
            class="thumb-placeholder"
          >
            🧊
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">
            {{ ex.title }}
          </div>
          <div class="card-desc">
            {{ ex.description || ex.title }}
          </div>
          <div class="card-tags">
            <span
              v-for="tag in ex.tags.slice(0, 3)"
              :key="tag"
              class="tag"
            >{{ tag }}</span>
          </div>
        </div>
      </router-link>
    </div>

    <div
      v-if="filteredExamples.length === 0"
      class="empty-tip"
    >
      暂无匹配示例
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAllExamples, getSources } from '../registry/index.js'

const keyword = ref('')
const sources = computed(() => [{ source: 'all', label: '全部' }, ...getSources()])
const currentSource = ref('all')
const currentCategory = ref('all')

const allExamples = computed(() => getAllExamples())

// 监听来源变化，重置分类
watch(currentSource, () => {
  currentCategory.value = 'all'
})

const subCategories = computed(() => {
  const cats = new Map()
  cats.set('all', { key: 'all', label: '全部' })
  allExamples.value.forEach(ex => {
    if (currentSource.value !== 'all' && ex.source !== currentSource.value) return
    const parts = ex.category.split('/').filter(Boolean)
    const key = parts.slice(1).join('/') || parts[0] || ex.category
    if (!cats.has(key)) {
      cats.set(key, { key, label: key })
    }
  })
  return Array.from(cats.values())
})

const filteredExamples = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return allExamples.value.filter(ex => {
    const matchSource = currentSource.value === 'all' || ex.source === currentSource.value
    const matchCategory =
      currentCategory.value === 'all' ||
      ex.category === currentCategory.value ||
      ex.category.endsWith('/' + currentCategory.value)
    const matchKw =
      !kw ||
      ex.title.toLowerCase().includes(kw) ||
      (ex.description && ex.description.toLowerCase().includes(kw)) ||
      ex.tags.some(tag => tag.toLowerCase().includes(kw))
    return matchSource && matchCategory && matchKw
  })
})
</script>

<style scoped>
.gallery {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: 32px;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
}

h1 {
  color: #4fc3f7;
  font-size: 28px;
  margin-bottom: 4px;
}

.subtitle {
  color: #888;
  font-size: 13px;
  margin-bottom: 24px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  color: #e0e0e0;
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: rgba(79, 195, 247, 0.5);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  color: #888;
  font-size: 12px;
  flex-shrink: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 6px 14px;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab.active {
  background: rgba(79, 195, 247, 0.2);
  border-color: rgba(79, 195, 247, 0.4);
  color: #4fc3f7;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.card:hover {
  background: rgba(79, 195, 247, 0.1);
  border-color: rgba(79, 195, 247, 0.3);
  transform: translateY(-2px);
}

.card-thumb {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  font-size: 32px;
}

.card-body {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  color: #e0e0e0;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.card-desc {
  color: #888;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.empty-tip {
  color: #888;
  text-align: center;
  padding: 48px 0;
  font-size: 14px;
}
</style>
