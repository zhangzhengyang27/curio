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
            交互式三维地理可视化示例，覆盖弧线、多边形、轨迹与专题数据图层。
          </p>
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
          <div class="card-media">
            <span class="card-icon-chip">
              <UiIcon
                :name="iconFor(ex.id)"
                :size="24"
              />
            </span>
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
          rel="noopener"
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
        该分类下暂无示例
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UiIcon, { type UiIconName } from '../components/UiIcon'

const activeCategory = ref('all')

const categoryTags = [
  { label: '全部', value: 'all' },
  { label: 'Three.js', value: 'three' },
  { label: '动画', value: 'animation' },
  { label: '数据', value: 'data' },
  { label: '多边形', value: 'polygons' },
  { label: '路径', value: 'paths' },
]

interface ThreeGlobeExample {
  id: string
  title: string
  desc: string
  tags: string[]
  category: string
}

const examples: ThreeGlobeExample[] = [
  { id: 'basic', title: 'Basic Globe Implementation', desc: '基础地球示例，展示等距矩形纹理贴图与 ThreeGlobe 初始化流程。', tags: ['基础', '贴图'], category: 'three' },
  { id: 'arcs', title: 'Arc Links', desc: '两点之间的弧线飞线，用于可视化全球连接与数据流动。', tags: ['弧线', '飞线'], category: 'paths' },
  { id: 'polygons', title: 'Country Polygons', desc: '基于 GeoJSON 渲染国家边界多边形，支持交互与样式定制。', tags: ['多边形', 'GeoJSON'], category: 'polygons' },
  { id: 'paths', title: 'Path Lines', desc: '在地球表面绘制轨迹路径与航线，展示移动与流动模式。', tags: ['路径', '轨迹'], category: 'paths' },
  { id: 'heatmap', title: 'Heatmap', desc: '点密度热力图，直观展示地理数据的空间分布与聚集情况。', tags: ['热力图', '密度'], category: 'data' },
  { id: 'hexbin', title: 'Hexagonal Binning', desc: '将数据点聚合到六边形分箱中，实现清晰的区域级统计可视化。', tags: ['六边形', '聚合'], category: 'data' },
  { id: 'hexed-polygons', title: 'Hexed Polygons', desc: '将国家多边形细分为六边形瓦片，适合现代统计风格展示。', tags: ['六边形', '多边形'], category: 'polygons' },
  { id: 'tiles', title: 'Tiles', desc: '球面瓦片片段数据，用于展示离散的区域分类信息。', tags: ['瓦片', 'Tile'], category: 'data' },
  { id: 'ripples', title: 'Ripple Rings', desc: '从事件位置向外扩散的同心圆涟漪动画，强调地理事件。', tags: ['涟漪', '动画'], category: 'animation' },
  { id: 'clouds', title: 'Clouds', desc: '在地球上方添加半透明的大气云层纹理效果。', tags: ['云层', '纹理'], category: 'three' },
  { id: 'day-night', title: 'Day/Night Cycle', desc: '模拟地球自转过程中的昼夜光照循环变化。', tags: ['昼夜', '光照'], category: 'animation' },
  { id: 'solar-terminator', title: 'Solar Terminator', desc: '绘制分隔昼夜的晨昏线，展示太阳终结线的天文效果。', tags: ['晨昏线', '天文'], category: 'animation' },
  { id: 'labels', title: 'Labels', desc: '在指定经纬度位置放置 3D 文字标签，用于地点标注。', tags: ['标签', '文字'], category: 'three' },
  { id: 'html-markers', title: 'HTML Markers', desc: '使用 HTML DOM 元素作为地图标记，支持复杂内容与交互。', tags: ['HTML', '标记'], category: 'three' },
  { id: 'satellites', title: 'Satellites', desc: '基于 TLE 数据实时计算并可视化绕地卫星轨道与位置。', tags: ['卫星', '轨道'], category: 'animation' },
  { id: 'tile-engine', title: 'Tiled Map Engine', desc: '集成瓦片地图引擎，为地球覆盖详细的底图数据。', tags: ['瓦片', '地图'], category: 'data' },
  { id: 'custom-material', title: 'Custom Material', desc: '应用自定义 Shader 与材质，创造独特的地球表面效果。', tags: ['材质', 'Shader'], category: 'three' },
  { id: 'custom-layer', title: 'Custom Layer', desc: '构建自定义 3D 对象图层并集成到地球场景中。', tags: ['自定义', '3D对象'], category: 'three' },
]

// 卡头统一为「图标芯片」：按条目 id 选用语义图标，替代此前的彩虹渐变 + emoji
const ID_ICONS: Record<string, UiIconName> = {
  basic: 'globe',
  arcs: 'link',
  polygons: 'map',
  paths: 'pin',
  heatmap: 'flame',
  hexbin: 'hex',
  'hexed-polygons': 'grid',
  tiles: 'grid',
  ripples: 'ripple',
  clouds: 'cloud',
  'day-night': 'contrast',
  'solar-terminator': 'sun',
  labels: 'tag',
  'html-markers': 'flag',
  satellites: 'satellite',
  'tile-engine': 'map',
  'custom-material': 'sparkle',
  'custom-layer': 'layers',
}

function iconFor(id: string): UiIconName {
  return ID_ICONS[id] ?? 'globe'
}

// 文本搜索维度已随页内搜索框一并移除(2026-09-29 双搜索合并):18 条静态列表
// 用分类 tags 浏览足够;顶栏搜索回车落 /examples 检索全库(smoke 契约钉住)
const filteredExamples = computed(() =>
  examples.filter(ex => activeCategory.value === 'all' || ex.category === activeCategory.value),
)
</script>

<style scoped>
.gallery-page {
  min-height: 100dvh;
  padding-top: calc(var(--cu-top-nav-height) + var(--cu-lg));
  padding-bottom: var(--cu-xl);
  padding-left: var(--cu-margin);
  padding-right: var(--cu-margin);
  background-color: var(--cu-background);
  color: var(--cu-on-surface);
}

.gallery-main {
  max-width: 1280px;
  margin: 0 auto;
}

.gallery-header {
  display: flex;
  flex-direction: column;
  gap: var(--cu-md);
  margin-bottom: var(--cu-lg);
}

@media (min-width: 768px) {
  .gallery-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.page-title {
  font-size: var(--cu-fs-3xl);
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cu-on-surface);
  margin-bottom: var(--cu-xs);
}

.page-subtitle {
  font-size: var(--cu-fs-md);
  line-height: 22px;
  color: var(--cu-on-surface-variant);
}



@media (min-width: 640px) {
}





.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cu-sm);
  margin-bottom: var(--cu-lg);
}

.tag-pill {
  padding: 6px 16px;
  border-radius: var(--cu-radius-full);
  border: 1px solid var(--cu-outline-variant);
  background: transparent;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
  line-height: 18px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease), color var(--cu-dur-fast) var(--cu-ease),
    border-color var(--cu-dur-fast) var(--cu-ease), transform 0.1s;
}

.tag-pill:hover {
  background: var(--cu-surface-container);
  color: var(--cu-on-surface);
}

.tag-pill.active {
  background: var(--cu-primary-container);
  color: var(--cu-on-primary-container);
  border-color: transparent;
}

.tag-pill:active {
  transform: scale(0.96);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
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
  background: var(--cu-surface-container-low);
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-lg);
  overflow: hidden;
  text-decoration: none;
  transition: transform var(--cu-dur) var(--cu-ease), box-shadow var(--cu-dur) var(--cu-ease),
    border-color var(--cu-dur) var(--cu-ease);
}

.example-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--cu-shadow-3);
  border-color: color-mix(in srgb, var(--cu-primary) 45%, transparent);
}

.example-card:hover .card-title {
  color: var(--cu-primary);
}

.example-card:hover .card-icon-chip {
  background: var(--cu-primary-container);
  color: var(--cu-on-primary-container);
  border-color: transparent;
}

.card-media {
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(340px 130px at 50% 0%, color-mix(in srgb, var(--cu-primary) 10%, transparent), transparent),
    var(--cu-surface-container);
  border-bottom: 1px solid var(--cu-outline-variant);
}

.card-icon-chip {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--cu-radius-lg);
  color: var(--cu-primary);
  background: color-mix(in srgb, var(--cu-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--cu-primary) 22%, transparent);
  transition: background var(--cu-dur) var(--cu-ease), color var(--cu-dur) var(--cu-ease),
    border-color var(--cu-dur) var(--cu-ease);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--cu-md);
}

.card-title {
  font-size: var(--cu-fs-lg);
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--cu-on-surface);
  margin-bottom: var(--cu-xs);
  transition: color var(--cu-dur-fast) var(--cu-ease);
}

.card-desc {
  flex: 1;
  font-size: var(--cu-fs-sm);
  line-height: 21px;
  color: var(--cu-on-surface-variant);
  margin-bottom: var(--cu-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
}

.card-tag {
  padding: 2px 9px;
  border-radius: var(--cu-radius-full);
  background: var(--cu-surface-container-high);
  border: 1px solid var(--cu-outline-variant);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-xs);
  line-height: 16px;
}

.submit-card {
  border-style: dashed;
  border-width: 1.5px;
  background: transparent;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.submit-card:hover {
  background: var(--cu-surface-container-low);
  border-color: color-mix(in srgb, var(--cu-primary) 45%, transparent);
  box-shadow: none;
}

.submit-card:hover .card-title {
  color: var(--cu-primary);
}

.submit-body {
  padding: var(--cu-md);
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
  border-radius: var(--cu-radius-full);
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface-variant);
  margin-bottom: var(--cu-md);
}

.submit-icon svg {
  width: 24px;
  height: 24px;
}

.empty-state {
  text-align: center;
  padding: var(--cu-xl) 0;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-md);
}
</style>
