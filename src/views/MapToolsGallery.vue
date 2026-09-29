<template>
  <div
    class="gallery-page"
    data-testid="tools-gallery"
  >
    <main class="gallery-main">
      <PageHeader
        title="地图工具箱"
        :count="TOOLS_EXAMPLES.length"
        count-label="个工具，点击卡片进入交互演示"
      >
        <template #description>
          基于 Cesium 的地图工具与空间分析示例。
        </template>
      </PageHeader>

      <div class="card-grid">
        <router-link
          v-for="ex in TOOLS_EXAMPLES"
          :key="ex.slug"
          :to="`/tools/${ex.slug}`"
          class="example-card"
          :data-slug="ex.slug"
          data-testid="tools-example-card"
        >
          <div class="card-media">
            <span class="card-icon-chip">
              <UiIcon
                :name="iconFor(ex.slug)"
                :size="22"
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
              >
                {{ t }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import UiIcon, { type UiIconName } from '../components/UiIcon'
import PageHeader from '../components/ui/PageHeader.vue'
import { TOOLS_EXAMPLES } from './tools-examples/index'

// 卡头不再使用彩虹渐变：统一为「图标芯片 + 主题色微光」，按 slug 选用语义图标
const SLUG_ICONS: Record<string, UiIconName> = {
  toolbox: 'toolbox',
  measurements: 'ruler',
  drawings: 'pencil',
  analyses: 'eye',
  flood: 'wave',
  navigation: 'compass',
  'overview-map': 'map',
  print: 'printer',
  'selection-indicator': 'marquee',
  'navigation-sm': 'target',
  'overlay-heatmap': 'flame',
  'overlay-html': 'tag',
  'overlay-echarts': 'chart',
  'overlay-typhoon': 'cyclone',
  'overlay-wind': 'wind',
  'overlay-dynamic': 'layers',
  'post-process': 'camera',
}

function iconFor(slug: string): UiIconName {
  return SLUG_ICONS[slug] ?? 'map'
}
</script>

<style scoped>
.gallery-page {
  position: fixed;
  top: var(--cu-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  background:
    radial-gradient(1100px 520px at 85% -12%, color-mix(in srgb, var(--cu-primary) 9%, transparent), transparent),
    var(--cu-background);
}

.gallery-main {
  max-width: 1160px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.example-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--cu-outline-variant);
  border-radius: var(--cu-radius-lg);
  overflow: hidden;
  background: var(--cu-surface-container-low);
  text-decoration: none;
  transition: transform var(--cu-dur) var(--cu-ease), border-color var(--cu-dur) var(--cu-ease),
    box-shadow var(--cu-dur) var(--cu-ease);
}

.example-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--cu-primary) 45%, transparent);
  box-shadow: var(--cu-shadow-3);
}

.example-card:hover .card-icon-chip {
  background: var(--cu-primary-container);
  color: var(--cu-on-primary-container);
  border-color: transparent;
}

.card-media {
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(340px 130px at 50% 0%, color-mix(in srgb, var(--cu-primary) 10%, transparent), transparent),
    var(--cu-surface-container);
  border-bottom: 1px solid var(--cu-outline-variant);
}

.card-icon-chip {
  width: 46px;
  height: 46px;
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
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px 18px 18px;
}

.card-title {
  margin: 0 0 6px;
  font-size: var(--cu-fs-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--cu-on-surface);
}

.card-desc {
  margin: 0 0 14px;
  font-size: var(--cu-fs-sm);
  line-height: 1.65;
  color: var(--cu-on-surface-variant);
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
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
  background: var(--cu-surface-container-high);
  border: 1px solid var(--cu-outline-variant);
}

.example-card:hover .card-tag {
  color: var(--cu-on-surface);
}
</style>
