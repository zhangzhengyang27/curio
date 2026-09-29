<template>
  <div class="cu-empty">
    <div class="cu-empty__icon">
      <slot name="icon">
        <UiIcon
          :name="icon"
          :size="28"
        />
      </slot>
    </div>
    <p class="cu-empty__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="cu-empty__desc"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="cu-empty__action"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiIcon, { type UiIconName } from '../UiIcon'

withDefaults(defineProps<{
  icon?: UiIconName
  title: string
  description?: string
}>(), { icon: 'hex' })
</script>

<style scoped>
.cu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cu-sm);
  padding: var(--cu-xl) var(--cu-pad);
  text-align: center;
}
.cu-empty__icon { color: var(--cu-on-surface-variant); opacity: 0.7; }
.cu-empty__title { font-size: var(--cu-fs-md); font-weight: 600; color: var(--cu-on-surface); }
.cu-empty__desc { font-size: var(--cu-fs-sm); color: var(--cu-on-surface-variant); }
.cu-empty__action { margin-top: var(--cu-xs); }
</style>
