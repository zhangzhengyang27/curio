<template>
  <div class="demo-root">
    <!--
      实心顶部信息栏（44px，与文件底部 lil-gui 全局偏移 calc(顶栏+44px) 严格对齐）。
      改版前元信息是 68% 透明度的 fixed 浮层，压在 3D 画布上后标题只有 12px、
      「查看代码」按钮对比度不达标，实际上看不见；且为了躲示例内部层叠上下文
      付出了 Teleport + z-index 的持续维护成本。移回文档流后两个问题同时消失。
    -->
    <header
      v-if="example"
      class="demo-topbar"
    >
      <div class="tb-left">
        <button
          type="button"
          class="back-btn"
          @click="goBackToList"
        >
          ← 返回列表
        </button>
        <span
          class="tb-divider"
          aria-hidden="true"
        />
        <h1 class="demo-title">
          {{ example?.title || '示例' }}
        </h1>
        <span
          v-if="demoMeta"
          class="demo-meta cu-num"
        >{{ demoMeta }}</span>
      </div>
      <div class="tb-right">
        <span class="demo-tags">
          <span
            v-for="tag in visibleTags"
            :key="tag"
            class="tag"
          >{{ tag }}</span>
          <span
            v-if="hiddenTagCount > 0"
            class="tag tag-more"
          >+{{ hiddenTagCount }}</span>
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
    </header>
    <div class="demo-body">
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
import { getExampleById, getSources } from '../registry/index.ts'
import { ensureRegistryLoaded } from '../composables/useExampleFilters'
import IframeRunner from '../runners/IframeRunner.vue'
import ExampleHost from './ExampleHost.vue'
import { loadExampleComponent, loadExampleSource } from '../components/index'
import { exampleCategoryLabel, exampleDiscriminator } from '../utils/exampleMeta'
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

/**
 * 「来源 · 分类 · id 尾段」一行摊开。
 *
 * 详情页原先只有标题：registry 里有 127 组重名标题（最糟的 32 条全叫
 * 「加载器：模型加载」，且 category / categoryLabel 也完全一样），
 * 用户从卡片点进来之后，页面上没有任何字段能说明这是 3dm 还是 3ds。
 */
const demoMeta = computed(() => {
  const ex = example.value
  if (!ex) return ''
  // 条目对象的 source 未必已注入（getExampleById 走单条查表），URL 里的那一段才是可靠来源
  const sourceSlug = (parsed.value as { source: string }).source || ex.source || ''
  const sourceFound = getSources().find(s => s.source === sourceSlug)
  return [
    sourceFound ? sourceFound.label : sourceSlug,
    exampleCategoryLabel(ex),
    exampleDiscriminator(ex),
  ].filter(Boolean).join(' · ')
})

// 44px 顶栏一行放不下全部标签：展示前 4 个，其余折叠成 +N
const MAX_TAGS = 4
const visibleTags = computed(() => (example.value?.tags || []).slice(0, MAX_TAGS))
const hiddenTagCount = computed(() => Math.max(0, (example.value?.tags || []).length - MAX_TAGS))

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
  top: var(--cu-top-nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--cu-background);
  display: flex;
  flex-direction: column;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--cu-xs);
  color: var(--cu-primary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
  transition: opacity 0.2s;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: inherit;
}

.back-btn:hover {
  opacity: 0.75;
}

/* ── 实心顶部信息栏 ────────────────────────────────────────────────
   高度 44px 是硬约束：全局样式把示例内 autoPlace 的 lil-gui 面板
   下移到 calc(var(--cu-top-nav-height) + 44px)，改这里必须同步改那里。 */
.demo-topbar {
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cu-md);
  padding: 0 var(--cu-md);
  background: var(--cu-surface-container-lowest);
  border-bottom: 1px solid var(--cu-outline-variant);
}

html.dark .demo-topbar {
  background: var(--cu-surface-container-low);
  border-bottom-color: var(--cu-outline);
}

.tb-left {
  display: flex;
  align-items: center;
  gap: var(--cu-sm);
  flex: 1;
  min-width: 0;
}

.tb-divider {
  width: 1px;
  height: 16px;
  background: var(--cu-outline);
  flex-shrink: 0;
}

/* 标题是这一栏的主角：15px/600 高对比，先于元信息被挤压 */
.demo-title {
  color: var(--cu-on-surface);
  font-size: 15px;
  line-height: 22px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo-meta {
  color: var(--cu-on-surface-variant);
  font-size: var(--cu-fs-xs);
  line-height: 18px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tb-right {
  display: flex;
  align-items: center;
  gap: var(--cu-sm);
  flex-shrink: 0;
  min-width: 0;
}

.demo-tags {
  display: flex;
  align-items: center;
  gap: var(--cu-xs);
  min-width: 0;
  overflow: hidden;
}

.code-btn {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--cu-radius-md);
  /* outline 档在明暗两种主题下都可见；variant 档（0.1 透明度）在暗色下近乎消失 */
  border: 1px solid var(--cu-outline);
  background: transparent;
  color: var(--cu-on-surface-variant);
  font-family: var(--cu-font-mono);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.code-btn:hover {
  color: var(--cu-primary);
  border-color: var(--cu-primary);
  background: var(--cu-surface-container);
}

.tag {
  background: color-mix(in srgb, var(--cu-secondary-container) 20%, transparent);
  color: var(--cu-on-secondary-container);
  font-family: var(--cu-font-mono);
  font-size: 11px;
  line-height: 16px;
  padding: 2px 8px;
  border-radius: var(--cu-radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.tag-more {
  background: transparent;
  border: 1px dashed var(--cu-outline);
  color: var(--cu-on-surface-variant);
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
  color: var(--cu-error);
  font-size: 14px;
  background: var(--cu-background);
}
</style>

<!-- 全局样式：示例内 autoPlace 的 lil-gui 面板默认 position:fixed; top:0; right:0，
     会盖住全局顶栏(56px)+示例顶部栏(44px)。在详情页(body 带 example-detail-active)
     时将其下移到两层顶栏之下，并压到代码抽屉(z-index:30)之下，避免遮挡。 -->
<style>
body.example-detail-active .lil-gui.root,
body.example-detail-active .lil-gui.lil-root {
  top: calc(var(--cu-top-nav-height) + 44px) !important;
  z-index: 20 !important;
}
</style>
