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

    <!--
      页码窗口只能到 ±2，省略号又是 disabled，所以 30 页里想去第 20 页只能一次次点下一页。
      这里补一个直接跳转，并把总页数显出来，用户才知道自己在哪里。
    -->
    <span
      v-if="totalPages > 7"
      class="page-jump"
    >
      <span class="page-jump-label">/ {{ totalPages }} 页，跳至</span>
      <input
        v-model="jump"
        class="page-jump-input cu-num"
        type="number"
        :min="1"
        :max="totalPages"
        aria-label="跳转到指定页码"
        @keydown.enter="jumpToPage"
      >
      <button
        class="page-jump-btn"
        :disabled="!valid"
        @click="jumpToPage"
      >
        跳转
      </button>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
// 示例中心分页器。页码窗口（含省略号）由父组件的 visiblePages 计算好传进来，
// 本组件只负责渲染与派发页码变化。
const props = defineProps({
  current: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  pages: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:current'])

const jump = ref('')
const valid = computed(() => {
  const n = Number(jump.value)
  return Number.isInteger(n) && n >= 1 && n <= props.totalPages && n !== props.current
})
// 翻页后父组件会滚回顶部，输入框里的旧页码也该跟着清掉
watch(() => props.current, () => { jump.value = '' })

function jumpToPage() {
  if (!valid.value) return
  emit('update:current', Number(jump.value))
}
</script>

<style scoped>
/* Pagination */
.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--cu-xs);
  margin-top: var(--cu-lg);
}

.page-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: var(--cu-radius-md);
  border: 1px solid var(--cu-outline-variant);
  background: var(--cu-surface-container-low);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-md);
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--cu-dur-fast) var(--cu-ease),
    color var(--cu-dur-fast) var(--cu-ease),
    border-color var(--cu-dur-fast) var(--cu-ease);
}

.page-btn svg {
  width: 18px;
  height: 18px;
}

.page-btn:hover:not(:disabled) {
  background: var(--cu-surface-container);
  color: var(--cu-on-surface);
}

.page-btn.active {
  /* 与 CuButton/段控同一语法:primary-container 底,双主题通用,不再要暗色特例 */
  background: var(--cu-primary-container);
  border-color: transparent;
  color: var(--cu-on-primary-container);
  font-weight: 600;
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

/* 直接跳转 */
.page-jump {
  display: inline-flex;
  align-items: center;
  gap: var(--cu-xs);
  margin-left: var(--cu-sm);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}

.page-jump-label {
  white-space: nowrap;
}

.page-jump-input {
  width: 60px;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--cu-radius-md);
  border: 1px solid var(--cu-outline-variant);
  background: var(--cu-surface-container-low);
  color: var(--cu-on-surface);
  font-family: inherit;
  font-size: var(--cu-fs-sm);
}

.page-jump-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--cu-radius-md);
  border: 1px solid var(--cu-outline-variant);
  background: var(--cu-surface-container-low);
  color: var(--cu-on-surface-variant);
  font-family: inherit;
  font-size: var(--cu-fs-sm);
  cursor: pointer;
  transition:
    background var(--cu-dur-fast) var(--cu-ease),
    color var(--cu-dur-fast) var(--cu-ease);
}

.page-jump-btn:hover:not(:disabled) {
  background: var(--cu-surface-container);
  color: var(--cu-on-surface);
}

.page-jump-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 暗色基调由容器令牌自理;active 已用 primary-container 双主题通用,仅输入框保留一档 */
html.dark .page-jump-input {
  background: var(--cu-surface-container);
}
</style>
