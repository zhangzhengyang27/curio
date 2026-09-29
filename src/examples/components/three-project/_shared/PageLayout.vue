<script setup lang="ts">
  import { ref } from "vue"

  /**
   * 页面布局组件 - 用于 Three.js 示例的统一布局（适配 curio 示例容器）
   */
  defineProps<{
    title: string
    description?: string
  }>()

  const expanded = ref(false)
</script>

<template>
  <div class="page-container">
    <!-- 可折叠的悬浮信息面板 -->
    <div
      class="page-info"
      :class="{ expanded }"
    >
      <div class="header-row">
        <h1>{{ title }}</h1>
        <button
          class="toggle-btn"
          @click="expanded = !expanded"
        >
          {{ expanded ? "收起" : "说明" }}
        </button>
      </div>

      <template v-if="expanded">
        <p
          v-if="description"
          class="description"
        >
          {{ description }}
        </p>

        <!-- 可滚动的内容区域 -->
        <div class="content-scroll">
          <slot name="content" />
        </div>

        <!-- 固定的导航链接 -->
        <div class="nav-links">
          <slot name="navigation" />
        </div>
      </template>
    </div>

    <router-link
      to="/examples"
      class="back-link"
    >
      ← 返回示例列表
    </router-link>

    <!-- Three.js 渲染容器 -->
    <slot />
  </div>
</template>

<style scoped>
  .page-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .page-info {
    position: absolute;
    top: 12px;
    left: 12px;
    color: white;
    background: rgba(0, 0, 0, 0.75);
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 10;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
    transition: max-height 0.25s ease;
    max-height: 52px;
    overflow: hidden;
  }

  .page-info.expanded {
    max-height: min(480px, calc(100% - 24px));
  }

  /* 可滚动的内容区域 */
  .content-scroll {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 12px;
    min-height: 0;
  }

  /* 自定义滚动条样式 */
  .content-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .content-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .content-scroll::-webkit-scrollbar-thumb {
    background: rgba(66, 185, 131, 0.6);
    border-radius: 3px;
  }

  .content-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(66, 185, 131, 0.8);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }

  .header-row h1 {
    margin: 0;
    font-size: 16px;
    color: #4fc3f7;
  }

  .toggle-btn {
    background: rgba(79, 195, 247, 0.2);
    border: 1px solid rgba(79, 195, 247, 0.4);
    color: #4fc3f7;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: rgba(79, 195, 247, 0.35);
  }

  .description {
    margin: 10px 0 0 0;
    font-size: 13px;
    color: #ccc;
    flex-shrink: 0;
  }

  .back-link {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: inline-block;
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #4fc3f7;
    text-decoration: none;
    border-radius: 6px;
    font-size: 13px;
    transition: all 0.2s;
    backdrop-filter: blur(6px);
  }

  .back-link:hover {
    background: rgba(79, 195, 247, 0.15);
    border-color: rgba(79, 195, 247, 0.3);
  }

  .nav-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
    padding-top: 8px;
  }

  /* 全局导航链接样式 */
  :deep(.link) {
    display: inline-block;
    padding: 6px 12px;
    background: #42b983;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s;
    font-size: 12px;
  }

  :deep(.link:hover) {
    background: #359268;
  }

  /* 信息区块样式 */
  :deep(.info-section) {
    margin-bottom: 12px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    border-left: 3px solid #42b983;
  }

  :deep(.info-section h3) {
    margin: 0 0 6px 0;
    font-size: 13px;
    color: #42b983;
  }

  :deep(.info-section ul) {
    margin: 0;
    padding-left: 18px;
    list-style: none;
  }

  :deep(.info-section li) {
    margin: 3px 0;
    font-size: 12px;
    color: #ccc;
  }

  :deep(.small-text) {
    font-size: 12px;
    color: #ccc;
    line-height: 1.5;
    margin: 0;
  }

  :deep(.code-tip) {
    margin-bottom: 12px;
    padding: 8px;
    background: rgba(66, 185, 131, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(66, 185, 131, 0.3);
  }

  :deep(.code-tip p) {
    margin: 0;
    font-size: 12px;
    color: #ccc;
  }

  :deep(.code-tip p:first-child) {
    color: #42b983;
    margin-bottom: 4px;
  }

  :deep(.controls-tip) {
    margin-bottom: 12px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    border-left: 3px solid #42b983;
  }

  :deep(.controls-tip p) {
    margin: 0 0 6px 0;
    font-size: 12px;
    color: #fff;
  }

  :deep(.controls-tip ul) {
    margin: 0;
    padding-left: 18px;
    list-style: none;
  }

  :deep(.controls-tip li) {
    margin: 3px 0;
    font-size: 12px;
    color: #ccc;
  }

  :deep(.features) {
    margin-bottom: 12px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  :deep(.features h3) {
    margin: 0 0 6px 0;
    font-size: 13px;
    color: #42b983;
  }

  :deep(.features ul) {
    margin: 0;
    padding-left: 18px;
    list-style: none;
  }

  :deep(.features li) {
    margin: 3px 0;
    font-size: 12px;
    color: #ccc;
  }
</style>
