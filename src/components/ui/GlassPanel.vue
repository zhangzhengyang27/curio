<template>
  <component
    :is="as"
    class="cu-glass"
    :class="[`cu-glass--${density}`, { 'cu-glass--interactive': interactive }]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * 全站唯一浮层/卡片容器语法(spec §5)。替代散落各处的 .tv-glass-panel class
 * (2026-09-30 更名 cu-glass-panel,作为 utility 与本组件并存于 theme.css);
 * 密度默认 none 以对齐旧容器「自管内边距」的行为,需要留白时显式传。
 */
withDefaults(defineProps<{
  density?: 'compact' | 'cozy' | 'loose' | 'none'
  /** 可交互面板:hover 主色描边 + 阴影升一档 */
  interactive?: boolean
  /** 浮层用 aside/section,卡片用 article */
  as?: string
}>(), { density: 'none', interactive: false, as: 'section' })
</script>

<style scoped>
/* 基类声明包 :where() 降为零特异性:页面用自己的类即可覆写圆角/描边等,
   不必再靠「子组件样式先注入」的顺序赢平局(终审 Minor #5) */
:where(.cu-glass) {
  background: var(--cu-surface-container-low);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--cu-outline-variant);
  box-shadow: var(--cu-shadow-1);
  border-radius: var(--cu-radius-lg);
}

/* 暗色基调:换成带透明度的 surface(与旧 .cu-glass-panel 的暗色行为一致) */
:global(html.dark) :where(.cu-glass) {
  background: var(--cu-surface);
}

/* 密度类同样零特异性:页面自管 padding 时显式传 density 也不会打架 */
:where(.cu-glass--compact) { padding: var(--cu-pad-compact); }
:where(.cu-glass--cozy) { padding: var(--cu-pad); }
:where(.cu-glass--loose) { padding: var(--cu-pad-loose); }
:where(.cu-glass--none) { padding: 0; }

.cu-glass--interactive {
  cursor: pointer;
  transition:
    border-color var(--cu-dur-fast) var(--cu-ease),
    box-shadow var(--cu-dur-fast) var(--cu-ease);
}
.cu-glass--interactive:hover {
  border-color: color-mix(in srgb, var(--cu-primary) 40%, var(--cu-outline-variant));
  box-shadow: var(--cu-shadow-2);
}
</style>
