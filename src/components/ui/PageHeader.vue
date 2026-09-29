<template>
  <header class="cu-page-header">
    <div class="cu-page-header__text">
      <h1 class="cu-page-header__title">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="cu-page-header__desc"
      >
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </div>
    <div
      v-if="count !== undefined || $slots.actions"
      class="cu-page-header__side"
    >
      <p
        v-if="count !== undefined"
        class="cu-page-header__count"
      >
        <span class="cu-num cu-page-header__count-num">{{ count }}</span>
        <span>{{ countLabel }}</span>
      </p>
      <div
        v-if="$slots.actions"
        class="cu-page-header__actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * 平台页统一页头(spec §6.3):标题 + 一句描述 + 右侧动作区。
 * 标题 600 字重(spec §4.3 字重收敛的落点);计数数字走 .cu-num + 数据语义色。
 */
withDefaults(defineProps<{
  title: string
  description?: string
  /** 统计数字(如条目数);不传则不渲染计数区 */
  count?: number
  countLabel?: string
}>(), { countLabel: '条' })
</script>

<style scoped>
.cu-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--cu-lg);
  margin-bottom: var(--cu-xl);
}
.cu-page-header__title {
  margin: 0 0 8px;
  font-size: var(--cu-fs-3xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--cu-on-surface);
}
.cu-page-header__desc {
  margin: 0;
  font-size: var(--cu-fs-md);
  color: var(--cu-on-surface-variant);
}
.cu-page-header__side {
  display: flex;
  align-items: center;
  gap: var(--cu-md);
  flex-shrink: 0;
  padding-bottom: 4px;
}
.cu-page-header__count {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--cu-xs);
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}
.cu-page-header__count-num {
  font-size: var(--cu-fs-xl);
  font-weight: 600;
  color: var(--cu-data-flight);
}
</style>
