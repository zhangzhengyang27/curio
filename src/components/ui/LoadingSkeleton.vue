<template>
  <div
    class="cu-skel"
    aria-hidden="true"
  >
    <div
      v-for="i in lines"
      :key="i"
      class="cu-skel__line"
      :style="{ width: widths[(i - 1) % widths.length] }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number
}>(), { lines: 3 })

// 末行收窄的伪文本节奏,比等宽行更像在「读内容」
const widths = ['100%', '92%', '78%']
</script>

<style scoped>
.cu-skel {
  display: flex;
  flex-direction: column;
  gap: var(--cu-sm);
  padding: var(--cu-pad);
}
.cu-skel__line {
  height: 14px;
  border-radius: var(--cu-radius-md);
  background: var(--cu-surface-container-high);
  animation: cu-skel-pulse 1.4s var(--cu-ease) infinite;
}
@keyframes cu-skel-pulse {
  50% { opacity: 0.55; }
}
</style>
