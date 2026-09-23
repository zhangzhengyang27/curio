<template>
  <router-link
    :to="`/examples/${ex.source}/${ex.category}/${ex.id}`"
    class="example-card"
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
        class="card-meta tv-num"
      >
        {{ metaLine }}
      </p>
      <p class="card-desc">
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

const props = defineProps({
  ex: { type: Object as PropType<RegistryExample>, required: true },
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

// 部分手工维护的条目可能没有 tags 字段，做一次兜底避免整张卡片渲染报错
const visibleTags = computed(() => (props.ex.tags || []).slice(0, 3))
</script>

<style scoped>
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
  background:
    radial-gradient(320px 120px at 50% 20%, color-mix(in srgb, var(--tv-primary) 10%, transparent), transparent),
    var(--tv-surface-container);
  transition: transform 0.5s ease;
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
  border-radius: var(--tv-radius-lg);
  color: var(--tv-primary);
  background: color-mix(in srgb, var(--tv-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--tv-primary) 22%, transparent);
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
  background: rgba(8, 12, 22, 0.66);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  opacity: 0;
  transition: opacity var(--tv-dur) var(--tv-ease), transform var(--tv-dur) var(--tv-ease);
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
  background: rgba(8, 12, 22, 0.66);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: var(--tv-fs-xs);
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

.card-meta {
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  color: var(--tv-on-surface-variant);
  opacity: 0.85;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  padding: 2px 9px;
  border-radius: var(--tv-radius-full);
  background: var(--tv-surface-container-high);
  border: 1px solid var(--tv-outline-variant);
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-xs);
  line-height: 16px;
}
</style>
