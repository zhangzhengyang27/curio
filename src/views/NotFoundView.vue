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
          to="/examples"
        >
          前往示例中心
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
  padding-top: var(--tv-top-nav-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--tv-background);
  color: var(--tv-on-surface);
}

.not-found-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tv-md);
  padding: var(--tv-xl) var(--tv-lg);
  text-align: center;
}

.code {
  font-family: var(--tv-font-mono);
  font-size: var(--tv-fs-3xl);
  font-weight: 700;
  color: var(--tv-primary);
  line-height: 1;
}

h1 {
  font-size: var(--tv-fs-xl);
  font-weight: 600;
}

.path {
  color: var(--tv-on-surface-variant);
  font-size: var(--tv-fs-sm);
}

.path code {
  font-family: var(--tv-font-mono);
  padding: 2px 6px;
  border-radius: var(--tv-radius-sm);
  background: var(--tv-surface-container);
}

.actions {
  display: flex;
  gap: var(--tv-sm);
  margin-top: var(--tv-sm);
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--tv-radius-lg);
  border: 1px solid var(--tv-outline);
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
  text-decoration: none;
  font-size: var(--tv-fs-md);
}

.action-btn.primary {
  background: var(--tv-primary);
  border-color: transparent;
  color: var(--tv-on-primary);
}
</style>
