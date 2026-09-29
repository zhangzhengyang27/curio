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
    <section class="kit-section">
      <h2>CuButton</h2>
      <div class="kit-row kit-align">
        <CuButton variant="primary">主要动作</CuButton>
        <CuButton>次要动作</CuButton>
        <CuButton
          variant="icon"
          aria-label="示例图标按钮"
        >
          <UiIcon
            name="camera"
            :size="18"
          />
        </CuButton>
        <CuButton
          variant="primary"
          loading
        >加载中</CuButton>
        <CuButton disabled>禁用</CuButton>
      </div>
    </section>
    <section class="kit-section">
      <h2>状态三件套</h2>
      <div class="kit-row">
        <GlassPanel
          data-testid="kit-empty"
          density="cozy"
          class="kit-state"
        >
          <EmptyState
            title="暂无数据"
            description="调整筛选条件或导入一份试试"
          >
            <template #action>
              <CuButton
                variant="primary"
                size="sm"
              >导入数据</CuButton>
            </template>
          </EmptyState>
        </GlassPanel>
        <GlassPanel
          data-testid="kit-error"
          density="cozy"
          class="kit-state"
        >
          <ErrorState
            title="数据加载失败"
            description="网络抖了,重试一下"
            @retry="retryCount++"
          />
        </GlassPanel>
        <GlassPanel
          data-testid="kit-skeleton"
          density="cozy"
          class="kit-state"
        >
          <LoadingSkeleton :lines="4" />
        </GlassPanel>
      </div>
      <p
        data-testid="kit-retry-count"
        class="kit-retry-log"
      >重试次数:{{ retryCount }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import CuButton from '../components/ui/CuButton.vue'
import UiIcon from '../components/UiIcon'
import EmptyState from '../components/ui/EmptyState.vue'
import ErrorState from '../components/ui/ErrorState.vue'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.vue'

const retryCount = ref(0)
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
.kit-align { align-items: center; }
.kit-state { width: 260px; }
.kit-retry-log { margin-top: var(--cu-md); color: var(--cu-on-surface-variant); font-size: var(--cu-fs-sm); }
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
