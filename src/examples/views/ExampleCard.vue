<template>
  <router-link
    :to="`/examples/${ex.source}/${ex.category}/${ex.id}`"
    class="example-card"
    :class="[`is-${view}`, { 'is-dense': dense }]"
  >
    <div class="card-media">
      <img
        v-if="thumbOk"
        :src="ex.thumbnail"
        :alt="ex.title"
        loading="lazy"
        @error="onThumbError"
      >
      <div
        v-else
        class="thumb-placeholder"
      >
        <span class="thumb-icon">
          <UiIcon
            name="globe"
            :size="26"
          />
        </span>
      </div>
      <div class="card-play">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      </div>
      <span class="source-badge">{{ sourceLabel }}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">
        {{ ex.title }}
      </h3>
      <p
        v-if="metaLine"
        class="card-meta cu-num"
      >
        {{ metaLine }}
      </p>
      <!--
        描述段只保留在列表视图：网格里它与标签内容大量重复（同一段技术栈
        文案在描述、标签、来源角标里出现 3~4 次），是卡片信息过载的主要来源。
        列表行有横向空间，一行描述能提供标签给不了的上下文。
      -->
      <p
        v-if="isList"
        class="card-desc"
      >
        {{ ex.description || ex.title }}
      </p>
      <div class="card-tags">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="card-tag"
        >{{ tag }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import UiIcon from '../../components/UiIcon'
import { getSources } from '../registry/index.ts'
import type { RegistryExample } from '../registry/index.ts'
import { exampleCategoryLabel, exampleDiscriminator } from '../utils/exampleMeta'
import type { GalleryView } from '../composables/useGalleryFilters'

const props = defineProps({
  ex: { type: Object as PropType<RegistryExample>, required: true },
  /** 网格 / 列表。列表视图把信息压成一行，同屏条目数是网格的 2~3 倍 */
  view: { type: String as () => GalleryView, default: 'grid' },
  /** 紧凑模式：网格下收掉描述与标签、缩紧留白，换来更多列 */
  dense: { type: Boolean, default: false },
})

// 数据源展示名（如 threejs-official → three.js 官方示例）
const sources = computed(() => [{ source: 'all', label: '全部' }, ...getSources()])
const sourceLabel = computed(() => {
  const found = sources.value.find(s => s.source === props.ex.source)
  return found ? found.label : props.ex.source
})

// 「加载器 · 3dm」这样的一行，用来分开同名同分类的条目（见 utils/exampleMeta）
const metaLine = computed(() =>
  [exampleCategoryLabel(props.ex), exampleDiscriminator(props.ex)].filter(Boolean).join(' · '),
)

// 缩略图加载失败（文件缺失 / 网络错误）时回退到占位符，避免破图。
// 状态由每张卡片自己持有，与其它卡片互不影响。
const thumbFailed = ref(false)
const thumbOk = computed(() => !!props.ex.thumbnail && !thumbFailed.value)
function onThumbError() {
  thumbFailed.value = true
}

// 列表视图才有描述段；网格卡片不再渲染（见模板内注释）
const isList = computed(() => props.view === 'list')

// 所有视图统一只留 2 个标签：描述段退场后标签是卡片最后一行噪音防线，
// 第 3 个起基本是同义反复（「粒子/点云」旁边再挂「粒子」）
const visibleTags = computed(() => (props.ex.tags || []).slice(0, 2))
</script>

<style scoped>
.example-card {
  display: flex;
  flex-direction: column;
  background: var(--cu-surface-container-lowest);
  border: 1px solid color-mix(in srgb, var(--cu-outline-variant) 30%, transparent);
  border-radius: var(--cu-radius-xl);
  overflow: hidden;
  text-decoration: none;
  box-shadow: var(--cu-shadow-1);
  transition:
    transform var(--cu-dur) var(--cu-ease),
    box-shadow var(--cu-dur) var(--cu-ease),
    border-color var(--cu-dur) var(--cu-ease),
    background var(--cu-dur) var(--cu-ease);
}

/* hover 微升(spec §6.4)对齐 GlassPanel interactive 语法:
   主色描边 + shadow 升档;暗色的表面抬档由下方 html.dark 分支继续负责 */
.example-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--cu-shadow-2);
  border-color: color-mix(in srgb, var(--cu-primary) 40%, var(--cu-outline-variant));
}

.example-card:hover .card-title {
  color: var(--cu-primary);
}

.example-card:hover .card-play {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.example-card:focus-visible {
  outline: 2px solid var(--cu-primary);
  outline-offset: 2px;
}

/* 暗色主题的表面分级：Material 的「lowest」档在暗色下与页面底色几乎同值，
   卡片只能靠一根细线与背景区分 —— 这是改版前「糊成一片」的根因。
   暗色下卡片抬到 container 档、描边换 outline，靠亮度差而不是细线分层。 */
html.dark .example-card {
  background: var(--cu-surface-container);
  border-color: var(--cu-outline);
}

html.dark .example-card:hover {
  background: var(--cu-surface-container-high);
  /* 暗色基底 (0,3,1) 恒胜亮色段写的 hover 描边 (0,3,0)——不在此重申的话
     主色描边在暗色下永远不出现(M3b 终审 Important#1,回归钉在 facets spec) */
  border-color: color-mix(in srgb, var(--cu-primary) 40%, var(--cu-outline));
}

.card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--cu-surface-container-low);
  flex-shrink: 0;
}

/* 封面内描边：1415 张封面饱和度/明度差异极大，一圈 1px 的收束线
   让高饱和封面与深浅两种页面底色之间都有一致边界 */
.card-media::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cu-outline) 30%, transparent);
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--cu-dur-slow) var(--cu-ease);
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
  background:
    radial-gradient(320px 120px at 50% 20%, color-mix(in srgb, var(--cu-primary) 10%, transparent), transparent),
    var(--cu-surface-container);
  transition: transform var(--cu-dur-slow) var(--cu-ease);
}

.example-card:hover .thumb-placeholder {
  transform: scale(1.05);
}

.thumb-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--cu-radius-lg);
  color: var(--cu-primary);
  background: color-mix(in srgb, var(--cu-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--cu-primary) 22%, transparent);
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
  border-radius: var(--cu-radius-full);
  background: rgba(8, 12, 22, 0.66);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  opacity: 0;
  transition: opacity var(--cu-dur) var(--cu-ease), transform var(--cu-dur) var(--cu-ease);
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
  border-radius: var(--cu-radius-sm);
  background: rgba(8, 12, 22, 0.66);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: var(--cu-fs-xs);
  line-height: 16px;
  font-weight: 500;
  backdrop-filter: blur(4px);
  max-width: calc(100% - 20px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--cu-md);
  min-width: 0;
}

/* 标题是卡片的第一信息：15px/600，必须明显强于下面的元信息行 */
.card-title {
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  color: var(--cu-on-surface);
  transition: color var(--cu-dur-fast) var(--cu-ease);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 描述只在列表视图渲染（见模板内注释）：一行收齐，不再占两行 */
.card-desc {
  font-size: var(--cu-fs-sm);
  line-height: 20px;
  color: var(--cu-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  gap: var(--cu-xs);
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 10px;
}

.card-tag {
  padding: 2px 9px;
  border-radius: var(--cu-radius-full);
  background: var(--cu-surface-container-high);
  border: 1px solid var(--cu-outline-variant);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-xs);
  line-height: 16px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 紧凑密度（网格）─────────────────────────────────────────────────
   收掉描述与标签、压扁图片，只留「封面 + 标题 + 来源」—— 1417 条里
   找一张见过的封面时，这个视图一屏能扫到的量是舒适模式的两倍以上。   */
.example-card.is-grid.is-dense .card-media {
  aspect-ratio: 16 / 9;
}

.example-card.is-grid.is-dense .card-body {
  padding: var(--cu-sm) var(--cu-sm) var(--cu-md);
  gap: 2px;
}

.example-card.is-grid.is-dense .card-title {
  font-size: 14px;
  line-height: 20px;
  -webkit-line-clamp: 1;
}

/* 紧凑网格只留「封面 + 标题 + 标签」，元信息行也收掉 */
.example-card.is-grid.is-dense .card-meta {
  display: none;
}

.example-card.is-grid.is-dense .card-tags {
  margin-top: auto;
  padding-top: 6px;
}

/* ── 列表视图 ────────────────────────────────────────────────────── */
.example-card.is-list {
  flex-direction: row;
  align-items: stretch;
}

.example-card.is-list .card-media {
  width: 220px;
  aspect-ratio: auto;
  align-self: stretch;
  min-height: 116px;
}

.example-card.is-list .card-body {
  padding: var(--cu-sm) var(--cu-md);
  justify-content: center;
  gap: 4px;
}

.example-card.is-list .card-title {
  font-size: 15px;
  line-height: 22px;
  -webkit-line-clamp: 1;
}

.example-card.is-list .card-desc {
  flex: 0 1 auto;
  -webkit-line-clamp: 1;
}

.example-card.is-list .card-tags {
  margin-top: 0;
  padding-top: 0;
}

.example-card.is-list .card-play {
  width: 36px;
  height: 36px;
}

.example-card.is-list .card-play svg {
  width: 19px;
  height: 19px;
}

.example-card.is-list.is-dense {
  border-radius: var(--cu-radius-lg);
}

.example-card.is-list.is-dense .card-media {
  width: 150px;
  min-height: 62px;
}

.example-card.is-list.is-dense .card-body {
  padding: 6px var(--cu-sm);
}

.example-card.is-list.is-dense .card-desc,
.example-card.is-list.is-dense .card-meta {
  display: none;
}

.example-card.is-list.is-dense .card-tags {
  display: none;
}
</style>
