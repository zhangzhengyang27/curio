<template>
  <button
    class="cu-btn"
    :class="[`cu-btn--${variant}`, `cu-btn--${size}`, { 'cu-btn--loading': loading }]"
    :disabled="disabled || loading"
    type="button"
  >
    <span
      v-if="loading"
      class="cu-btn__spinner"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'icon'
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
}>(), { variant: 'ghost', size: 'md', loading: false, disabled: false })
</script>

<style scoped>
.cu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cu-xs);
  border: 1px solid transparent;
  border-radius: var(--cu-radius-md);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--cu-dur-fast) var(--cu-ease),
    color var(--cu-dur-fast) var(--cu-ease),
    border-color var(--cu-dur-fast) var(--cu-ease),
    box-shadow var(--cu-dur-fast) var(--cu-ease);
}
.cu-btn:focus-visible {
  outline: none;
  box-shadow: var(--cu-focus-ring);
}
.cu-btn:disabled { cursor: not-allowed; opacity: 0.6; }

.cu-btn--sm { height: 28px; padding: 0 var(--cu-sm); font-size: var(--cu-fs-sm); }
.cu-btn--md { height: 36px; padding: 0 var(--cu-md); font-size: var(--cu-fs-md); }
.cu-btn--icon.cu-btn--sm { width: 28px; padding: 0; }
.cu-btn--icon.cu-btn--md { width: 36px; padding: 0; }

.cu-btn--primary {
  background: var(--cu-primary);
  color: var(--cu-on-primary);
}
.cu-btn--primary:not(:disabled):hover {
  box-shadow: var(--cu-glow-sm);
}
.cu-btn--ghost {
  background: transparent;
  color: var(--cu-on-surface-variant);
  border-color: var(--cu-outline-variant);
}
.cu-btn--ghost:not(:disabled):hover {
  background: var(--cu-surface-container);
  color: var(--cu-on-surface);
}
.cu-btn--icon {
  background: transparent;
  color: var(--cu-on-surface-variant);
}
.cu-btn--icon:not(:disabled):hover {
  background: var(--cu-surface-container);
  color: var(--cu-primary);
}

.cu-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: cu-btn-spin 0.8s linear infinite;
}
@keyframes cu-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
