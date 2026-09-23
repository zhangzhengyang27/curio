<template>
  <section
    class="filter-section"
    :class="{ 'is-collapsed': !open }"
  >
    <button
      type="button"
      class="section-head"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg
        class="section-chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span class="section-title">{{ title }}</span>
      <!--
        分区可能被侧栏自身的滚动推出视野，所以「这一区选中了什么」必须挂在标题上，
        否则用户只知道有筛选生效，却看不出是哪个维度。
      -->
      <span
        v-if="selected"
        class="section-selected"
        :title="selected"
      >{{ selected }}</span>
      <span class="section-badge tv-num">{{ count }}</span>
    </button>
    <div
      v-show="open"
      class="section-body"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 侧栏里的一个可折叠分区（技术栈 / 数据源 / 专题分类共用）。
// 折叠状态只影响展示，不改任何筛选语义 —— 折叠后里面选中的条件仍然生效，
// 所以分区标题上要带一个「已选几个」的角标，否则用户会以为条件丢了。
const props = defineProps({
  title: { type: String, required: true },
  /** 分区里的条目数（不含「全部」）；用于标题角标 */
  count: { type: Number, default: 0 },
  /** 该区当前选中的展示名；'all' 与空串表示未选，不渲染角标 */
  selected: { type: String, default: '' },
  defaultOpen: { type: Boolean, default: true },
})

const open = ref(props.defaultOpen)
</script>

<style scoped>
.filter-section + .filter-section {
  margin-top: var(--tv-xs);
}

.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--tv-radius-md);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-family: inherit;
  font-size: var(--tv-fs-xs);
  line-height: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: left;
  cursor: pointer;
  transition: background var(--tv-dur-fast) var(--tv-ease), color var(--tv-dur-fast) var(--tv-ease);
  /*
    侧栏三个分区加起来超过一屏，会在侧栏内部滚动。
    标题粘住后，滚到多深都能看到当前分区名与该区的选中值。
  */
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--tv-surface-container-lowest);
}

.section-head:hover {
  background: var(--tv-surface-container);
  color: var(--tv-on-surface);
}

.section-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform var(--tv-dur-fast) var(--tv-ease);
}

.filter-section:not(.is-collapsed) .section-chevron {
  transform: rotate(90deg);
}

.section-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-badge {
  flex-shrink: 0;
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--tv-radius-full);
  background: var(--tv-surface-container-high);
  font-size: 11px;
  line-height: 17px;
  font-weight: 600;
  text-align: center;
  color: var(--tv-on-surface-variant);
}

.section-selected {
  flex-shrink: 1;
  min-width: 0;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--tv-fs-xs);
  font-weight: 600;
  letter-spacing: 0;
  color: var(--tv-primary);
}

.section-body {
  padding: 2px 0 6px;
}
</style>
