<template>
  <div
    v-if="totalPages > 1"
    class="pagination"
  >
    <button
      :disabled="current === 1"
      class="page-btn"
      @click="$emit('update:current', current - 1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <button
      v-for="(page, idx) in pages"
      :key="`${page}-${idx}`"
      :class="['page-btn', { active: current === page, ellipsis: page === '...' }]"
      :disabled="page === '...'"
      @click="page !== '...' && $emit('update:current', page)"
    >
      {{ page }}
    </button>
    <button
      :disabled="current === totalPages"
      class="page-btn"
      @click="$emit('update:current', current + 1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </div>
</template>

<script setup>
// 示例中心分页器。页码窗口（含省略号）由父组件的 visiblePages 计算好传进来，
// 本组件只负责渲染与派发页码变化。
defineProps({
  current: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  pages: { type: Array, default: () => [] },
})

defineEmits(['update:current'])
</script>

<style scoped>
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

/* Dark mode overrides */
html.dark .page-btn.active {
  background: var(--tv-secondary-container);
  border-color: var(--tv-secondary-container);
  color: var(--tv-on-secondary-container);
}
</style>
