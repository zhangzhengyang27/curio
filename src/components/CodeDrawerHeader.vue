<template>
  <div class="code-header">
    <div class="code-title">
      <svg
        class="code-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <div class="title-text">
        <span class="title-name">{{ title }}</span>
      </div>
    </div>
    <div class="code-actions">
      <button
        class="action-btn header-copy"
        :disabled="!activeSection?.code"
        :title="copiedIndex === activeIndex ? '已复制' : '复制代码'"
        @click="copySection(activeIndex)"
      >
        <svg
          v-if="copiedIndex !== activeIndex"
          class="action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
          />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          v-else
          class="action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{{ copiedIndex === activeIndex ? '已复制' : '复制' }}</span>
      </button>
      <button
        class="action-btn close-btn"
        aria-label="关闭"
        title="关闭"
        @click="$emit('close')"
      >
        <svg
          class="action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
          />
          <line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
// CodeDrawer 的标题栏：纯展示组件。
// 复制与关闭都以事件抛给父组件，本组件不碰剪贴板、不持有 activeIndex 状态。
defineProps({
  title: { type: String, default: '示例源码' },
  // 当前激活的一节；为 null 或没有 code 时，复制按钮禁用
  activeSection: { type: Object, default: null },
  activeIndex: { type: Number, default: 0 },
  copiedIndex: { type: Number, default: -1 },
})

defineEmits(['copy', 'close'])
</script>

<style scoped>
.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tv-sm);
  padding: var(--tv-sm) var(--tv-md);
  border-bottom: 1px solid var(--tv-outline-variant);
  flex-shrink: 0;
}

.code-title {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  min-width: 0;
}

.code-icon {
  width: 18px;
  height: 18px;
  color: var(--tv-primary);
  flex-shrink: 0;
}

.title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--tv-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-actions {
  display: flex;
  align-items: center;
  gap: var(--tv-xs);
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--tv-radius-md);
  border: 1px solid var(--tv-outline-variant);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--tv-surface-container);
  color: var(--tv-primary);
  border-color: var(--tv-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 15px;
  height: 15px;
}

.close-btn {
  padding: 0;
  width: 28px;
  justify-content: center;
}
</style>
