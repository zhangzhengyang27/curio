<template>
  <div class="viz-modebar">
    <button
      v-for="mode in modes"
      :key="mode.key"
      :class="['viz-btn', { active: current === mode.key, loading: loading === mode.key }]"
      @click="mode.key === 'import' ? emit('import') : emit('switch', mode.key)"
    >
      <span
        v-if="loading === mode.key"
        class="viz-icon viz-spinner"
        aria-label="加载中"
      />
      <UiIcon
        v-else-if="mode.icon"
        class="viz-icon"
        :name="mode.icon"
        :size="15"
      />
      <span>{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { VizMode } from './vizModes'

/**
 * 底部可视化模式条的按钮行(自 EarthView 原样迁出):12 个模式按钮 + loading 态。
 * `.bottom-bar` 定位与玻璃外壳留在 EarthView(类名是 E2E 契约,冻结);
 * 本组件只负责 `.viz-btn` 系按钮行样式。模式数据与类型在 ./vizModes.ts
 * (<script setup> 不允许 ES export)。
 */
defineProps<{
  modes: VizMode[]
  current: string
  /** 正在加载的模式 key(无则不显示 spinner) */
  loading?: string
}>()

const emit = defineEmits<{ switch: [mode: string]; import: [] }>()
</script>

<style scoped>
.viz-modebar {
  display: flex;
  align-items: center;
  gap: var(--cu-xs);
}

.viz-btn {
  display: flex;
  align-items: center;
  gap: var(--cu-xs);
  padding: var(--cu-xs) var(--cu-md);
  border-radius: var(--cu-radius-full);
  border: none;
  background: transparent;
  color: var(--cu-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color var(--cu-dur-fast) var(--cu-ease),
    background var(--cu-dur-fast) var(--cu-ease);
}

.viz-btn:hover {
  color: var(--cu-primary);
  background: var(--cu-surface-container);
}

.viz-btn.active {
  background: var(--cu-primary);
  color: var(--cu-on-primary);
}

.viz-icon {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.viz-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-top-color: var(--cu-primary, #4f8ef7);
  border-radius: 50%;
  animation: viz-spin 0.8s linear infinite;
}

@keyframes viz-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
