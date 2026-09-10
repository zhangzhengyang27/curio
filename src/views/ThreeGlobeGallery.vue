<template>
  <div class="gallery-page">
    <main class="gallery-main">
      <!-- Header & Filters -->
      <header class="gallery-header">
        <div class="header-text">
          <h1 class="page-title">
            ThreeGlobe 示例集
          </h1>
          <p class="page-subtitle">
            Explore interactive 3D geospatial visualizations and implementation examples.
          </p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <svg
              class="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="搜索示例..."
              type="text"
            >
          </div>
          <button
            class="filter-btn"
            @click="showFilters = !showFilters"
          >
            <svg
              class="filter-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filters
          </button>
        </div>
      </header>

      <!-- Tags -->
      <div class="tags-row">
        <button
          v-for="tag in categoryTags"
          :key="tag.value"
          :class="['tag-pill', { active: activeCategory === tag.value }]"
          @click="activeCategory = tag.value"
        >
          {{ tag.label }}
        </button>
      </div>

      <!-- Grid Layout -->
      <div class="card-grid">
        <router-link
          v-for="ex in filteredExamples"
          :key="ex.id"
          :to="`/three-globe/${ex.id}`"
          class="example-card"
        >
          <div
            class="card-media"
            :style="{ '--card-gradient': ex.gradient }"
          >
            <div class="card-image">
              <span class="card-emoji">{{ ex.icon }}</span>
            </div>
            <div class="card-image-overlay" />
          </div>
          <div class="card-body">
            <h3 class="card-title">
              {{ ex.title }}
            </h3>
            <p class="card-desc">
              {{ ex.desc }}
            </p>
            <div class="card-tags">
              <span
                v-for="t in ex.tags"
                :key="t"
                class="card-tag"
              >{{ t }}</span>
            </div>
          </div>
        </router-link>

        <!-- Submit / Contribute Card -->
        <a
          href="https://github.com/vasturiano/three-globe"
          target="_blank"
          class="example-card submit-card"
        >
          <div class="submit-body">
            <div class="submit-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <h3 class="card-title">贡献示例</h3>
            <p class="card-desc">提交你的 ThreeGlobe 可视化案例，丰富示例集。</p>
          </div>
        </a>
      </div>

      <p
        v-if="filteredExamples.length === 0"
        class="empty-state"
      >
        未找到匹配 “{{ searchQuery }}” 的示例
      </p>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const showFilters = ref(false)
const activeCategory = ref('all')

const categoryTags = [
  { label: 'All', value: 'all' },
  { label: 'Three.js', value: 'three' },
  { label: 'Animation', value: 'animation' },
  { label: 'Data', value: 'data' },
  { label: 'Polygons', value: 'polygons' },
  { label: 'Paths', value: 'paths' },
]

const examples = [
  { id: 'basic', icon: '🌍', title: 'Basic Globe Implementation', desc: '基础地球示例，展示等距矩形纹理贴图与 ThreeGlobe 初始化流程。', tags: ['基础', '贴图'], category: 'three', gradient: 'linear-gradient(135deg, #0057c2 0%, #50dcff 100%)' },
  { id: 'arcs', icon: '🔗', title: 'Arc Links', desc: '两点之间的弧线飞线，用于可视化全球连接与数据流动。', tags: ['弧线', '飞线'], category: 'paths', gradient: 'linear-gradient(135deg, #00687b 0%, #48d7f9 100%)' },
  { id: 'polygons', icon: '🗺️', title: 'Country Polygons', desc: '基于 GeoJSON 渲染国家边界多边形，支持交互与样式定制。', tags: ['多边形', 'GeoJSON'], category: 'polygons', gradient: 'linear-gradient(135deg, #9e3d00 0%, #ffb695 100%)' },
  { id: 'paths', icon: '📍', title: 'Path Lines', desc: '在地球表面绘制轨迹路径与航线，展示移动与流动模式。', tags: ['路径', '轨迹'], category: 'paths', gradient: 'linear-gradient(135deg, #0057c2 0%, #afc6ff 100%)' },
  { id: 'heatmap', icon: '🔥', title: 'Heatmap', desc: '点密度热力图，直观展示地理数据的空间分布与聚集情况。', tags: ['热力图', '密度'], category: 'data', gradient: 'linear-gradient(135deg, #ba1a1a 0%, #ff6b6b 100%)' },
  { id: 'hexbin', icon: '⬡', title: 'Hexagonal Binning', desc: '将数据点聚合到六边形分箱中，实现清晰的区域级统计可视化。', tags: ['六边形', '聚合'], category: 'data', gradient: 'linear-gradient(135deg, #00687b 0%, #50dcff 100%)' },
  { id: 'hexed-polygons', icon: '🔷', title: 'Hexed Polygons', desc: '将国家多边形细分为六边形瓦片，适合现代统计风格展示。', tags: ['六边形', '多边形'], category: 'polygons', gradient: 'linear-gradient(135deg, #0057c2 0%, #48d7f9 100%)' },
  { id: 'tiles', icon: '🧩', title: 'Tiles', desc: '球面瓦片片段数据，用于展示离散的区域分类信息。', tags: ['瓦片', 'Tile'], category: 'data', gradient: 'linear-gradient(135deg, #9e3d00 0%, #ffdbcc 100%)' },
  { id: 'ripples', icon: '🌊', title: 'Ripple Rings', desc: '从事件位置向外扩散的同心圆涟漪动画，强调地理事件。', tags: ['涟漪', '动画'], category: 'animation', gradient: 'linear-gradient(135deg, #00687b 0%, #afecff 100%)' },
  { id: 'clouds', icon: '☁️', title: 'Clouds', desc: '在地球上方添加半透明的大气云层纹理效果。', tags: ['云层', '纹理'], category: 'three', gradient: 'linear-gradient(135deg, #727786 0%, #dfe2eb 100%)' },
  { id: 'day-night', icon: '🌓', title: 'Day/Night Cycle', desc: '模拟地球自转过程中的昼夜光照循环变化。', tags: ['昼夜', '光照'], category: 'animation', gradient: 'linear-gradient(135deg, #0057c2 0%, #181c22 100%)' },
  { id: 'solar-terminator', icon: '🌅', title: 'Solar Terminator', desc: '绘制分隔昼夜的晨昏线，展示太阳终结线的天文效果。', tags: ['晨昏线', '天文'], category: 'animation', gradient: 'linear-gradient(135deg, #9e3d00 0%, #ffb695 100%)' },
  { id: 'labels', icon: '🏷️', title: 'Labels', desc: '在指定经纬度位置放置 3D 文字标签，用于地点标注。', tags: ['标签', '文字'], category: 'three', gradient: 'linear-gradient(135deg, #0057c2 0%, #d9e2ff 100%)' },
  { id: 'html-markers', icon: '📌', title: 'HTML Markers', desc: '使用 HTML DOM 元素作为地图标记，支持复杂内容与交互。', tags: ['HTML', '标记'], category: 'three', gradient: 'linear-gradient(135deg, #00687b 0%, #d9e2ff 100%)' },
  { id: 'satellites', icon: '🛰️', title: 'Satellites', desc: '基于 TLE 数据实时计算并可视化绕地卫星轨道与位置。', tags: ['卫星', '轨道'], category: 'animation', gradient: 'linear-gradient(135deg, #181c22 0%, #414755 100%)' },
  { id: 'tile-engine', icon: '🗺️', title: 'Tiled Map Engine', desc: '集成瓦片地图引擎，为地球覆盖详细的底图数据。', tags: ['瓦片', '地图'], category: 'data', gradient: 'linear-gradient(135deg, #0057c2 0%, #50dcff 100%)' },
  { id: 'custom-material', icon: '🎨', title: 'Custom Material', desc: '应用自定义 Shader 与材质，创造独特的地球表面效果。', tags: ['材质', 'Shader'], category: 'three', gradient: 'linear-gradient(135deg, #9e3d00 0%, #c64f00 100%)' },
  { id: 'custom-layer', icon: '✨', title: 'Custom Layer', desc: '构建自定义 3D 对象图层并集成到地球场景中。', tags: ['自定义', '3D对象'], category: 'three', gradient: 'linear-gradient(135deg, #00687b 0%, #0057c2 100%)' },
]

const filteredExamples = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return examples.filter(ex => {
    const matchesSearch = !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.desc.toLowerCase().includes(q) ||
      ex.tags.some(t => t.toLowerCase().includes(q))
    const matchesCategory = activeCategory.value === 'all' || ex.category === activeCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  padding-top: calc(var(--tv-top-nav-height) + var(--tv-lg));
  padding-bottom: var(--tv-xl);
  padding-left: var(--tv-margin);
  padding-right: var(--tv-margin);
  background-color: var(--tv-background);
  color: var(--tv-on-background);
}

.gallery-main {
  max-width: 1280px;
  margin: 0 auto;
}

.gallery-header {
  display: flex;
  flex-direction: column;
  gap: var(--tv-md);
  margin-bottom: var(--tv-lg);
}

@media (min-width: 768px) {
  .gallery-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--tv-on-surface);
  margin-bottom: var(--tv-xs);
}

.page-subtitle {
  font-size: 14px;
  line-height: 22px;
  color: var(--tv-on-surface-variant);
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: var(--tv-sm);
  align-items: center;
}

@media (min-width: 640px) {
  .header-actions {
    flex-direction: row;
  }
}

.search-box {
  position: relative;
  width: 100%;
}

@media (min-width: 640px) {
  .search-box {
    width: 256px;
  }
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--tv-outline);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 40px;
  background: var(--tv-surface-container-low);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-lg);
  font-size: 14px;
  line-height: 22px;
  color: var(--tv-on-surface);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: var(--tv-outline);
}

.search-input:focus {
  border-color: var(--tv-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--tv-primary) 12%, transparent);
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--tv-xs);
  width: 100%;
  padding: 8px 16px;
  background: var(--tv-surface-container-low);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-lg);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--tv-on-surface-variant);
  cursor: pointer;
  transition: background 0.2s;
}

@media (min-width: 640px) {
  .filter-btn {
    width: auto;
  }
}

.filter-btn:hover {
  background: var(--tv-surface-container);
}

.filter-icon {
  width: 18px;
  height: 18px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tv-sm);
  margin-bottom: var(--tv-lg);
}

.tag-pill {
  padding: 6px 16px;
  border-radius: var(--tv-radius-full);
  border: none;
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface-variant);
  font-size: 12px;
  line-height: 18px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.1s;
}

.tag-pill:hover {
  background: var(--tv-surface-variant);
}

.tag-pill.active {
  background: var(--tv-primary);
  color: var(--tv-on-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tv-primary) 30%, transparent);
}

.tag-pill:active {
  transform: scale(0.96);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--tv-lg);
}

@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
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

.card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--card-gradient);
}

.card-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s ease;
}

.example-card:hover .card-image {
  transform: scale(1.05);
}

.card-emoji {
  font-size: 56px;
  line-height: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.card-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.example-card:hover .card-image-overlay {
  opacity: 1;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--tv-md);
}

.card-title {
  font-size: 20px;
  line-height: 28px;
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
  flex-wrap: wrap;
  gap: var(--tv-xs);
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

.submit-card {
  border-style: dashed;
  border-width: 2px;
  background: var(--tv-surface-container-low);
  align-items: center;
  justify-content: center;
  text-align: center;
}

.submit-card:hover {
  background: var(--tv-surface-container);
}

.submit-body {
  padding: var(--tv-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.submit-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--tv-radius-full);
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface-variant);
  margin-bottom: var(--tv-md);
}

.submit-icon svg {
  width: 24px;
  height: 24px;
}

.empty-state {
  text-align: center;
  padding: var(--tv-xl) 0;
  color: var(--tv-on-surface-variant);
  font-size: 14px;
}

/* Dark mode overrides */
html.dark .example-card:hover .card-title {
  color: var(--tv-secondary-fixed);
}

html.dark .example-card:hover {
  border-color: color-mix(in srgb, var(--tv-secondary-fixed) 40%, transparent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--tv-secondary-fixed) 12%, rgba(0, 0, 0, 0.2));
}

html.dark .tag-pill.active {
  background: var(--tv-secondary-container);
  color: var(--tv-on-secondary-container);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tv-secondary-container) 30%, transparent);
}
</style>
