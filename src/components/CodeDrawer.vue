<template>
  <Transition name="code-modal">
    <div
      v-if="open"
      class="code-modal-mask"
      @click="$emit('close')"
    >
      <div
        class="code-modal"
        @click.stop
      >
        <CodeDrawerHeader
          :title="title"
          :active-section="activeSection"
          :active-index="activeIndex"
          :copied-index="copiedIndex"
          @copy="copySection"
          @close="$emit('close')"
        />

        <div
          v-if="sections && sections.length > 1"
          class="code-tabs"
        >
          <button
            v-for="(sec, i) in sections"
            :key="i"
            class="code-tab"
            :class="{ active: i === activeIndex }"
            :title="sec.filename"
            @click="activeIndex = i"
          >
            {{ tabLabel(sec.filename) }}
          </button>
        </div>

        <div class="code-body custom-scrollbar">
          <div
            v-if="loading"
            class="code-loading"
          >
            <span class="spinner" />
            正在加载源码…
          </div>
          <template v-else-if="activeSection">
            <div
              v-if="!activeSection.code"
              class="code-empty"
            >
              未能获取源码。
            </div>
            <!-- eslint-disable vue/no-v-html -- 高亮结果由 escapeHtml/hljs 转义后拼装，不含未转义的用户输入 -->
            <pre
              v-else
              class="code-pre"
            ><code
            class="hljs"
            v-html="highlightCode(activeSection.code, activeSection.filename)"
            /></pre>
            <!-- eslint-enable vue/no-v-html -->
          </template>
          <div
            v-else
            class="code-empty"
          >
            未能获取源码。
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import CodeDrawerHeader from './CodeDrawerHeader.vue'
// 高亮配色是全局样式（选择器已用 .code-modal 限定），独立成文件，不留在组件里
import '../styles/code-highlight.css'
// 语法高亮逻辑已抽到 useCodeHighlight（纯逻辑，无 UI 依赖）
import { useCodeHighlight } from '../composables/useCodeHighlight.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '示例源码' },
  // 多节代码：每项 { filename, code }；第 1 节通常是主示例，后续为其引用的 ExampleScene 等
  sections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { highlightCode, tabLabel } = useCodeHighlight()

const activeIndex = ref(0)
const copiedIndex = ref(-1)
let copyTimer = null

// 当前激活的那一节（tab 选中项）
const activeSection = computed(() => props.sections?.[activeIndex.value] || null)

async function copySection(i) {
  const code = props.sections?.[i]?.code
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
  } catch (e) {
    // 降级：用 textarea + execCommand
    const ta = document.createElement('textarea')
    ta.value = code
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch (_) {}
    document.body.removeChild(ta)
  }
  copiedIndex.value = i
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedIndex.value = -1
  }, 1500)
}

// 打开 / 关闭时复位 tab 与复制状态
watch(
  () => props.open,
  (v) => {
    if (v) {
      // 每次打开重置到第一个 tab（不同示例的节不同）
      activeIndex.value = 0
    }
    if (!v && copiedIndex.value !== -1) {
      copiedIndex.value = -1
      if (copyTimer) clearTimeout(copyTimer)
    }
  }
)

// 居中弹窗交互：打开时锁定背景滚动 + 监听 ESC 关闭
function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
watch(
  () => props.open,
  (v) => {
    if (v) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  }
)
onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
  // 与上面两项保持一致：卸载时也要清掉复制状态的定时器
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})

// 切换示例（sections 引用变化）时回到第一个 tab
watch(
  () => props.sections,
  () => {
    activeIndex.value = 0
  }
)

// 切换 tab 时复位复制状态（避免跨 tab 还显示"已复制"）
watch(activeIndex, () => {
  if (copiedIndex.value !== -1) {
    copiedIndex.value = -1
    if (copyTimer) clearTimeout(copyTimer)
  }
})
</script>
<style scoped>
.code-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--tv-md);
  background: rgba(0, 0, 0, 0.5);
}

.code-modal {
  position: relative;
  width: min(820px, 92vw);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--tv-surface-container-lowest);
  border: 1px solid var(--tv-outline-variant);
  border-radius: var(--tv-radius-lg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
}

.code-body {
  flex: 1;
  overflow: auto;
  position: relative;
}

/* tab 切换栏：仅在有多个代码节时出现 */
.code-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 4px;
  padding: 8px var(--tv-md);
  border-bottom: 1px solid var(--tv-outline-variant);
  background: var(--tv-surface-container);
  flex-shrink: 0;
}

.code-tab {
  flex: 0 0 auto;
  max-width: 180px;
  padding: 5px 12px;
  border-radius: var(--tv-radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.18s;
}

.code-tab:hover {
  background: var(--tv-surface-container-high);
  color: var(--tv-on-surface);
}

.code-tab.active {
  background: var(--tv-primary);
  color: #fff;
  border-color: var(--tv-primary);
}

.code-pre {
  margin: 0;
  padding: var(--tv-md);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  tab-size: 2;
  color: var(--tv-on-surface);
}

.code-pre code {
  font-family: inherit;
  white-space: pre;
}

.code-loading,
.code-empty {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  padding: var(--tv-lg);
  color: var(--tv-on-surface-variant);
  font-size: 13px;
}

.code-empty {
  line-height: 1.7;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--tv-outline-variant);
  border-top-color: var(--tv-primary);
  border-radius: 50%;
  animation: code-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes code-spin {
  to {
    transform: rotate(360deg);
  }
}

.code-modal-enter-active,
.code-modal-leave-active {
  transition: opacity 0.28s ease;
}

.code-modal-enter-active .code-modal,
.code-modal-leave-active .code-modal {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.code-modal-enter-from,
.code-modal-leave-to {
  opacity: 0;
}

.code-modal-enter-from .code-modal,
.code-modal-leave-to .code-modal {
  transform: scale(0.96);
  opacity: 0;
}
</style>
