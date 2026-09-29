<template>
  <span class="cu-tip">
    <slot />
    <span
      class="cu-tip__bubble"
      :class="`cu-tip__bubble--${placement}`"
      role="tooltip"
      :data-testid="testdata"
    >
      <span class="cu-tip__text">{{ label }}</span>
      <kbd
        v-if="kbd"
        class="cu-tip__kbd"
      >{{ kbd }}</kbd>
    </span>
  </span>
</template>

<script setup lang="ts">
/**
 * 替代原生 title 属性与各页面手搓 tooltip(spec §5)。
 * 纯 CSS 悬停/聚焦显隐,无定位库;触发元素必须只有一个根元素。
 */
withDefaults(defineProps<{
  label: string
  /** 快捷键标注,如 'S' / 'Space' / '⌘K';无则不显示 */
  kbd?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** 供 E2E 定位气泡(可选) */
  testdata?: string
}>(), { placement: 'top' })
</script>

<style scoped>
.cu-tip {
  position: relative;
  display: inline-flex;
}
.cu-tip__bubble {
  position: absolute;
  z-index: 400;
  display: flex;
  align-items: center;
  gap: var(--cu-xs);
  padding: 4px 10px;
  border-radius: var(--cu-radius-md);
  background: var(--cu-inverse-surface);
  color: var(--cu-inverse-on-surface);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  box-shadow: var(--cu-shadow-2);
  transition: opacity var(--cu-dur-fast) var(--cu-ease);
}
.cu-tip:hover .cu-tip__bubble,
.cu-tip:focus-within .cu-tip__bubble {
  opacity: 1;
  /* 悬停 300ms 后才出现,避免扫过工具栏时气泡乱闪 */
  transition-delay: 300ms;
}
.cu-tip__bubble--top { bottom: calc(100% + 8px); left: 50%; translate: -50% 0; }
.cu-tip__bubble--bottom { top: calc(100% + 8px); left: 50%; translate: -50% 0; }
.cu-tip__bubble--left { right: calc(100% + 10px); top: 50%; translate: 0 -50%; }
.cu-tip__bubble--right { left: calc(100% + 10px); top: 50%; translate: 0 -50%; }

.cu-tip__kbd {
  font-family: var(--cu-font-mono);
  font-size: 10px;
  line-height: 14px;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, var(--cu-inverse-on-surface) 35%, transparent);
  border-radius: var(--cu-radius-sm);
}
</style>
