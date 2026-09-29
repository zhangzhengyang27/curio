<template>
  <div
    class="cu-error-state"
    role="alert"
  >
    <div class="cu-error-state__icon">
      <UiIcon
        name="alert"
        :size="28"
      />
    </div>
    <p class="cu-error-state__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="cu-error-state__desc"
    >
      {{ description }}
    </p>
    <CuButton
      variant="primary"
      size="sm"
      @click="emit('retry')"
    >
      {{ retryText }}
    </CuButton>
  </div>
</template>

<script setup lang="ts">
import CuButton from './CuButton.vue'
import UiIcon from '../UiIcon'

withDefaults(defineProps<{
  title?: string
  description?: string
  retryText?: string
}>(), { title: '加载失败', retryText: '重试' })

const emit = defineEmits<{ retry: [] }>()
</script>

<style scoped>
.cu-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-xl) var(--cu-pad);
  text-align: center;
}
.cu-error-state__icon { color: var(--cu-error); }
.cu-error-state__title { font-size: var(--cu-fs-md); font-weight: 600; }
.cu-error-state__desc { font-size: var(--cu-fs-sm); color: var(--cu-on-surface-variant); }
</style>
