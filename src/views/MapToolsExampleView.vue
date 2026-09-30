<template>
  <component
    :is="exampleComp"
    v-if="exampleComp"
    :key="slug"
  />
  <div
    v-else
    class="not-found cu-glass-panel"
    data-testid="example-not-found"
  >
    <p>未找到示例「{{ slug }}」</p>
    <RouterLink to="/tools">
      ← 返回示例列表
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { getToolsExample } from './tools-examples/index'

const props = defineProps({
  slug: { type: String, required: true },
})

const exampleComp = computed(() => {
  const entry = getToolsExample(props.slug)
  return entry ? defineAsyncComponent(entry.component) : null
})
</script>

<style scoped>
.not-found {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 24px 32px;
  border-radius: 12px;
  color: #eee;
  text-align: center;
}

.not-found a {
  color: #8ec9ff;
}
</style>
