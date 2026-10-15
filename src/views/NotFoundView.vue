<template>
  <section class="not-found-page">
    <div class="not-found-card">
      <p class="code">
        404
      </p>
      <h1>页面未找到</h1>
      <p class="path">
        没有匹配 <code>{{ route.fullPath }}</code> 的路由
      </p>
      <div class="actions">
        <RouterLink
          class="action-btn primary"
          to="/"
        >
          返回地球
        </RouterLink>
        <RouterLink
          class="action-btn"
          to="/three-globe"
        >
          ThreeGlobe 示例集
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.not-found-page {
  min-height: 100dvh;
  padding-top: var(--cu-top-nav-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cu-background);
  color: var(--cu-on-surface);
}

.not-found-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--cu-md);
  padding: var(--cu-xl) var(--cu-lg);
  text-align: center;
}

.code {
  font-family: var(--cu-font-mono);
  font-size: var(--cu-fs-3xl);
  font-weight: 700;
  color: var(--cu-primary);
  line-height: 1;
}

h1 {
  font-size: var(--cu-fs-xl);
  font-weight: 600;
}

.path {
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-sm);
}

.path code {
  font-family: var(--cu-font-mono);
  padding: 2px 6px;
  border-radius: var(--cu-radius-sm);
  background: var(--cu-surface-container);
}

.actions {
  display: flex;
  gap: var(--cu-sm);
  margin-top: var(--cu-sm);
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--cu-radius-lg);
  border: 1px solid var(--cu-outline);
  background: var(--cu-surface-container-high);
  color: var(--cu-on-surface);
  text-decoration: none;
  font-size: var(--cu-fs-md);
}

.action-btn.primary {
  background: var(--cu-primary);
  border-color: transparent;
  color: var(--cu-on-primary);
}
</style>
