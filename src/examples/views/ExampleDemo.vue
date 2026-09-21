<template>
  <div class="demo-root">
    <div class="demo-body">
      <!-- 浮动元信息：Teleport 到 body，避免被 .demo-body overflow:hidden 或示例内部层叠上下文盖住 -->
      <Teleport to="body">
        <div
          v-if="example"
          class="demo-float-meta"
        >
          <div class="meta-top">
            <button
              type="button"
              class="back-btn"
              @click="goBackToList"
            >
              ← 返回示例列表
            </button>
            <span class="demo-title">{{ example?.title || '示例' }}</span>
          </div>
          <div class="meta-bottom">
            <span class="demo-tags">
              <span
                v-for="tag in example.tags"
                :key="tag"
                class="tag"
              >{{ tag }}</span>
            </span>
            <button
              v-if="example.runner === 'vue'"
              class="code-btn"
              title="查看当前示例的源码"
              @click="openCode"
            >
              &lt;/&gt; 查看代码
            </button>
          </div>
        </div>
      </Teleport>
      <div
        v-if="!example"
        class="error-tip"
      >
        未找到示例：{{ examplePath }}
      </div>
      <ExampleHost
        v-else-if="example.runner === 'vue' && vueComponent"
        :key="exampleKey"
        :comp="vueComponent"
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

    <Teleport to="body">
      <CodeDrawer
        :open="showCode"
        :title="example?.title || '示例源码'"
        :sections="codeSections"
        :loading="codeLoading"
        @close="showCode = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExampleById } from '../registry/index.ts'
import { ensureRegistryLoaded } from '../composables/useExampleFilters'
import IframeRunner from '../runners/IframeRunner.vue'
import ExampleHost from './ExampleHost.vue'
import { loadExampleComponent, loadExampleSource } from '../components/index'
import CodeDrawer from '../../components/CodeDrawer.vue'

const route = useRoute()
const router = useRouter()

// 返回示例列表：若是从画廊（带筛选/搜索/页码）点进来的，优先浏览器后退以完整保留
// 画廊的 tech/sub/search/page 状态；若直接打开详情页（无历史），则回退到画廊首页。
function goBackToList() {
  const state = window.history.state
  if (state && state.back) {
    router.back()
  } else {
    router.push('/examples')
  }
}

function normalizePathMatch(value: unknown) {
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

const registryReady = ref(false)
ensureRegistryLoaded().then(() => { registryReady.value = true })

const example = computed(() => {
  if (!registryReady.value) return null
  const parsed2 = parsed.value as { source: string; category: string; id: string }
  if (!parsed2.source || !parsed2.category || !parsed2.id) return null
  const found = getExampleById(parsed2.source, parsed2.category, parsed2.id)
  // 被展示层隐藏的条目走同一条「未找到示例」分支，直连 URL 也进不去
  return found && !found.displayHidden ? found : null
})

const exampleKey = computed(() => {
  const { source, category, id } = parsed.value
  return `${source}-${category}-${id}`
})

const vueComponent = computed(() => {
  const p2 = parsed.value as { source: string; category: string; id: string }
  if (!p2.source || !p2.category || !p2.id || example.value?.runner !== 'vue') return null
  return loadExampleComponent(p2.source, p2.category, p2.id)
})

// 「查看代码」抽屉状态
const showCode = ref(false)
const codeLoading = ref(false)
// 多节代码：第 1 节为主示例，后续为它引用的 ExampleScene 共享壳
const codeSections = ref<Array<{ filename: string; code: string }>>([])

async function openCode() {
  if (!example.value || example.value.runner !== 'vue') return
  const p3 = parsed.value as { source: string; category: string; id: string }
  showCode.value = true
  codeLoading.value = true
  codeSections.value = []
  const result = await loadExampleSource(p3.source, p3.category, p3.id)
  const sections: Array<{ filename: string; code: string }> = []
  if (result) {
    // 用真实命中的 glob key 作为文件名（去掉 ./ 前缀），可能与约定名不一致
    sections.push({ filename: result.path.replace(/^\.\//, ''), code: result.code })
    for (const scene of result.scenes || []) {
      sections.push({ filename: scene.path.replace(/^\.\//, ''), code: scene.code })
    }
  }
  codeSections.value = sections
  codeLoading.value = false
}

// 进入详情页时给 body 加标记，供全局样式把示例内的 lil-gui 面板下移到顶栏之下
onMounted(() => {
  document.body.classList.add('example-detail-active')
})
onBeforeUnmount(() => {
  document.body.classList.remove('example-detail-active')
})
</script>

<style scoped>
.demo-root {
  position: fixed;
  top: var(--tv-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--tv-background);
  display: flex;
  flex-direction: column;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tv-xs);
  color: var(--tv-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  transition: color 0.2s;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: inherit;
}

.back-btn:hover {
  color: var(--tv-primary-container);
}

/* 浮动元信息：固定在示例内容左上角，不占顶栏文档流空间。
   用 position:fixed + 高 z-index 让它脱离 .demo-root 的层叠上下文，
   避免被示例内部的全屏覆盖层、lil-gui 面板（默认 z-index:1001）等挡住点击。 */
.demo-float-meta {
  position: fixed;
  top: calc(var(--tv-top-nav-height) + 12px);
  left: 12px;
  z-index: 1002;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: var(--tv-sm);
  padding: var(--tv-sm) var(--tv-md);
  background: color-mix(in srgb, var(--tv-surface-container-lowest) 68%, transparent);
  backdrop-filter: blur(10px);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-md);
  max-width: calc(100% - 24px);
}

.meta-top {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  min-width: 0;
}

.meta-bottom {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  flex-wrap: wrap;
}

.demo-title {
  color: var(--tv-on-surface);
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tv-xs);
  flex-shrink: 0;
  max-width: 64vw;
}

.code-btn {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--tv-radius-md);
  border: 1px solid var(--tv-outline-variant);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.code-btn:hover {
  color: var(--tv-primary);
  border-color: var(--tv-primary);
  background: var(--tv-surface-container);
}

.tag {
  background: color-mix(in srgb, var(--tv-secondary-container) 20%, transparent);
  color: var(--tv-on-secondary-container);
  font-family: monospace;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--tv-radius-sm);
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
  color: var(--tv-error);
  font-size: 14px;
  background: var(--tv-background);
}
</style>

<!-- 全局样式：示例内 autoPlace 的 lil-gui 面板默认 position:fixed; top:0; right:0，
     会盖住全局顶栏(56px)+示例顶部栏(44px)。在详情页(body 带 example-detail-active)
     时将其下移到两层顶栏之下，并压到代码抽屉(z-index:30)之下，避免遮挡。 -->
<style>
body.example-detail-active .lil-gui.root,
body.example-detail-active .lil-gui.lil-root {
  top: calc(var(--tv-top-nav-height) + 44px) !important;
  z-index: 20 !important;
}
</style>
