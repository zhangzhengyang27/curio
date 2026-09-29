<template>
  <div class="design-kit">
    <h1>设计套件 · Design System v2</h1>
    <p class="kit-desc">
      基础组件与令牌自检页(不进导航,URL 直达 /design-kit)。
      右上角可切换明暗,两套主题都必须可读。
    </p>

    <section class="kit-section">
      <h2>GlassPanel</h2>
      <div class="kit-row">
        <GlassPanel
          density="compact"
          class="kit-box"
        >compact · 12</GlassPanel>
        <GlassPanel
          density="cozy"
          class="kit-box"
        >cozy · 16</GlassPanel>
        <GlassPanel
          density="loose"
          class="kit-box"
        >loose · 24</GlassPanel>
        <GlassPanel
          interactive
          density="cozy"
          class="kit-box"
        >interactive(试试悬停)</GlassPanel>
      </div>
    </section>
    <!-- 后续任务在此追加各组件段落 -->
  </div>
</template>

<script setup lang="ts">
import GlassPanel from '../components/ui/GlassPanel.vue'
</script>

<style scoped>
.design-kit {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--cu-xl) var(--cu-gutter) 80px;
}
.kit-desc {
  color: var(--cu-on-surface-variant);
  margin: var(--cu-sm) 0 var(--cu-xl);
}
.kit-section { margin-bottom: var(--cu-xl); }
.kit-section h2 {
  font-size: var(--cu-fs-lg);
  font-weight: 600;
  margin-bottom: var(--cu-md);
}
.kit-row { display: flex; gap: var(--cu-md); flex-wrap: wrap; }
.kit-box {
  min-width: 150px;
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}
</style>
