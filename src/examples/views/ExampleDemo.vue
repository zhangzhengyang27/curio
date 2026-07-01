<template>
  <div class="demo-root">
    <div class="top-bar">
      <router-link
        to="/examples"
        class="back-btn"
      >
        ← 返回示例列表
      </router-link>
      <span class="demo-title">{{ example?.title || '示例' }}</span>
      <span
        v-if="example"
        class="demo-tags"
      >
        <span
          v-for="tag in example.tags"
          :key="tag"
          class="tag"
        >{{ tag }}</span>
      </span>
    </div>
    <div class="demo-body">
      <div
        v-if="!example"
        class="error-tip"
      >
        未找到示例：{{ examplePath }}
      </div>
      <component
        :is="vueComponent"
        v-else-if="example.runner === 'vue' && vueComponent"
        :key="exampleKey"
        :example="example"
      />
      <div
        v-else-if="example.runner === 'vue' && !vueComponent"
        class="error-tip"
      >
        未找到 Vue 组件：{{ examplePath }}
      </div>
      <IframeRunner
        v-else-if="example.runner === 'iframe'"
        :key="exampleKey"
        :example="example"
      />
      <div
        v-else
        class="error-tip"
      >
        暂不支持的运行器：{{ example.runner }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getExampleById } from '../registry/index.js'
import IframeRunner from '../runners/IframeRunner.vue'
import { loadExampleComponent } from '../components/index.js'

const route = useRoute()

function normalizePathMatch(value) {
  if (Array.isArray(value)) return value.join('/')
  if (typeof value === 'string') {
    // Vue Router 5 可能将多段通配符序列化为逗号分隔的字符串
    if (value.includes(',')) return value.replace(/,/g, '/')
    return value
  }
  return ''
}

const examplePath = computed(() => {
  const source = route.params.source || ''
  const pathMatch = normalizePathMatch(route.params.pathMatch)
  return `${source}/${pathMatch}`
})

const parsed = computed(() => {
  const source = route.params.source || ''
  const pathMatch = normalizePathMatch(route.params.pathMatch)
  const parts = pathMatch.split('/').filter(Boolean)
  const id = parts.pop() || ''
  const category = parts.join('/')
  return { source, category, id }
})

const example = computed(() => {
  const { source, category, id } = parsed.value
  if (!source || !category || !id) return null
  return getExampleById(source, category, id)
})

const exampleKey = computed(() => {
  const { source, category, id } = parsed.value
  return `${source}-${category}-${id}`
})

const vueComponent = computed(() => {
  const { source, category, id } = parsed.value
  if (!source || !category || !id || example.value?.runner !== 'vue') return null
  return loadExampleComponent(source, category, id)
})
</script>

<style scoped>
.demo-root {
  position: fixed;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  flex-direction: column;
}

.top-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.back-btn {
  color: #4fc3f7;
  text-decoration: none;
  font-size: 13px;
  margin-right: 12px;
  flex-shrink: 0;
}

.back-btn:hover {
  color: #81d4fa;
}

.demo-title {
  color: #ccc;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.tag {
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.demo-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.error-tip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6b6b;
  font-size: 14px;
  background: #0a0a1a;
}
</style>
