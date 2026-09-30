<template>
  <div class="gallery-toolbar">
    <div class="toolbar-left">
      <span class="result-count cu-num">共 {{ count }} 个示例</span>
      <span
        v-if="count > 0"
        class="range-hint cu-num"
      >
        第 {{ rangeStart }}–{{ rangeEnd }} 条
      </span>
    </div>

    <div class="toolbar-right">
      <label class="field">
        <span class="field-label">排序</span>
        <select
          v-model="sortModel"
          class="control"
          aria-label="排序方式"
        >
          <option
            v-for="o in sortOptions"
            :key="o.key"
            :value="o.key"
          >
            {{ o.label }}
          </option>
        </select>
      </label>

      <div
        class="segmented"
        role="group"
        aria-label="视图"
      >
        <button
          type="button"
          :class="{ on: view === 'grid' }"
          aria-label="网格视图"
          title="网格视图"
          @click="$emit('update:view', 'grid')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="4"
              width="7"
              height="7"
              rx="1"
            />
            <rect
              x="13"
              y="4"
              width="7"
              height="7"
              rx="1"
            />
            <rect
              x="4"
              y="13"
              width="7"
              height="7"
              rx="1"
            />
            <rect
              x="13"
              y="13"
              width="7"
              height="7"
              rx="1"
            />
          </svg>
        </button>
        <button
          type="button"
          :class="{ on: view === 'list' }"
          aria-label="列表视图"
          title="列表视图"
          @click="$emit('update:view', 'list')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div
        class="segmented"
        role="group"
        aria-label="信息密度"
      >
        <button
          type="button"
          :class="{ on: density === 'comfortable' }"
          aria-label="舒适密度"
          title="舒适密度"
          @click="$emit('update:density', 'comfortable')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="5"
              width="16"
              height="6"
              rx="1.2"
            />
            <rect
              x="4"
              y="13"
              width="16"
              height="6"
              rx="1.2"
            />
          </svg>
        </button>
        <button
          type="button"
          :class="{ on: density === 'compact' }"
          aria-label="紧凑密度"
          title="紧凑密度"
          @click="$emit('update:density', 'compact')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect
              x="4"
              y="4"
              width="16"
              height="3.4"
              rx="1"
            />
            <rect
              x="4"
              y="10.3"
              width="16"
              height="3.4"
              rx="1"
            />
            <rect
              x="4"
              y="16.6"
              width="16"
              height="3.4"
              rx="1"
            />
          </svg>
        </button>
      </div>

      <label class="field">
        <span class="field-label">每页</span>
        <select
          v-model="sizeModel"
          class="control cu-num"
          aria-label="每页条数"
        >
          <option
            v-for="n in pageSizeOptions"
            :key="n"
            :value="n"
          >
            {{ n }} 条
          </option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SORT_OPTIONS, PAGE_SIZE_OPTIONS } from '../composables/useGalleryFilters'
import type { GalleryDensity, GallerySortKey, GalleryView } from '../composables/useGalleryFilters'
// 结果区上方的工具条：结果计数 + 排序 + 视图 + 密度 + 每页条数。
// 全部是受控组件，状态在 useGalleryFilters 里，这样刷新/分享链接能还原整个视图。
const props = defineProps({
  count: { type: Number, required: true },
  rangeStart: { type: Number, default: 0 },
  rangeEnd: { type: Number, default: 0 },
  sort: { type: String as () => GallerySortKey, default: 'default' },
  view: { type: String as () => GalleryView, default: 'grid' },
  density: { type: String as () => GalleryDensity, default: 'comfortable' },
  pageSize: { type: Number, default: 48 },
})

const emit = defineEmits(['update:sort', 'update:view', 'update:density', 'update:pageSize'])

const sortOptions = SORT_OPTIONS
const pageSizeOptions = PAGE_SIZE_OPTIONS

const sortModel = computed({
  get: () => props.sort,
  set: (v: GallerySortKey) => emit('update:sort', v),
})
const sizeModel = computed({
  get: () => props.pageSize,
  set: (v: number) => emit('update:pageSize', Number(v)),
})
</script>

<style scoped>
.gallery-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--cu-sm) var(--cu-md);
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: var(--cu-sm);
  min-width: 0;
}

.result-count {
  font-size: var(--cu-fs-md);
  line-height: 22px;
  font-weight: 600;
  color: var(--cu-on-surface);
  white-space: nowrap;
}

.range-hint {
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cu-sm);
}

.field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.field-label {
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
  white-space: nowrap;
}

.control {
  height: 32px;
  padding: 0 26px 0 10px;
  border-radius: var(--cu-radius-md);
  border: 1px solid var(--cu-outline-variant);
  background: var(--cu-surface-container-lowest);
  color: var(--cu-on-surface);
  font-family: inherit;
  font-size: var(--cu-fs-sm);
  line-height: 20px;
  cursor: pointer;
  /* 原生下拉箭头随主题走，这里只去掉系统外观、补一个自己的 */
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: right 12px center, right 7px center;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  transition: border-color var(--cu-dur-fast) var(--cu-ease);
}

.control:hover {
  border-color: var(--cu-primary);
}

.control:focus-visible {
  outline: 2px solid var(--cu-primary);
  outline-offset: 1px;
}

.segmented {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--cu-radius-md);
  border: 1px solid var(--cu-outline-variant);
  background: var(--cu-surface-container-low);
}

.segmented button {
  width: 30px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--cu-radius-sm);
  background: transparent;
  color: var(--cu-on-surface-variant);
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease), color var(--cu-dur-fast) var(--cu-ease);
}

.segmented button svg {
  width: 16px;
  height: 16px;
}

.segmented button:hover {
  color: var(--cu-on-surface);
}

.segmented button.on {
  background: var(--cu-primary-container);
  color: var(--cu-on-primary-container);
}

.segmented button:focus-visible {
  outline: 2px solid var(--cu-primary);
  outline-offset: 1px;
}

/* 暗色下 lowest/low 档控件贴进粘性工具条的底色里，抬一档保持可见 */
html.dark .control,
html.dark .segmented {
  background: var(--cu-surface-container);
}
</style>
