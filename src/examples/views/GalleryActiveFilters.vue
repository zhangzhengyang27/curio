<template>
  <!--
    已选条件条。原来四个筛选维度全靠 URL 表达，界面上只在侧栏里各高亮一行，
    用户滚到网格中段就完全看不出「我现在筛了什么」，也找不到一次性清空的入口。
  -->
  <div
    v-if="filters.length"
    class="active-filters"
  >
    <span class="af-label">已选条件</span>
    <button
      v-for="f in filters"
      :key="f.key"
      type="button"
      class="af-chip"
      :title="`移除条件：${f.label} · ${f.value}`"
      @click="$emit('clear', f.key)"
    >
      <span class="af-chip-label">{{ f.label }}</span>
      <span class="af-chip-value">{{ f.value }}</span>
      <svg
        class="af-x"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
    <button
      type="button"
      class="af-clear"
      @click="$emit('clear-all')"
    >
      清除全部
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ActiveFilter } from '../composables/useGalleryFilters'
// 已选条件的可视化与逐个移除。整个 chip 就是移除按钮 —— 不要把 × 单独做成热区，
// 那样命中面积太小，且读屏用户拿不到「点这里会移除哪个条件」的信息。
defineProps({
  filters: { type: Array as PropType<ActiveFilter[]>, default: () => [] },
})

defineEmits(['clear', 'clear-all'])
</script>

<style scoped>
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cu-xs);
}

.af-label {
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  color: var(--cu-on-surface-variant);
  margin-right: 2px;
}

.af-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 280px;
  padding: 3px 8px;
  border-radius: var(--cu-radius-full);
  border: 1px solid color-mix(in srgb, var(--cu-primary) 32%, transparent);
  background: color-mix(in srgb, var(--cu-primary) 10%, transparent);
  color: var(--cu-on-surface);
  font-family: inherit;
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease), border-color var(--cu-dur-fast) var(--cu-ease);
}

.af-chip:hover {
  background: color-mix(in srgb, var(--cu-primary) 20%, transparent);
  border-color: var(--cu-primary);
}

.af-chip:focus-visible {
  outline: 2px solid var(--cu-primary);
  outline-offset: 1px;
}

.af-chip-label {
  color: var(--cu-on-surface-variant);
  flex-shrink: 0;
}

.af-chip-value {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.af-x {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  opacity: 0.7;
}

.af-chip:hover .af-x {
  opacity: 1;
}

.af-clear {
  padding: 3px 10px;
  border-radius: var(--cu-radius-full);
  border: 1px solid var(--cu-outline-variant);
  background: transparent;
  color: var(--cu-on-surface-variant);
  font-family: inherit;
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  cursor: pointer;
  transition: background var(--cu-dur-fast) var(--cu-ease), color var(--cu-dur-fast) var(--cu-ease);
}

.af-clear:hover {
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface);
}

.af-clear:focus-visible {
  outline: 2px solid var(--cu-primary);
  outline-offset: 1px;
}
</style>
