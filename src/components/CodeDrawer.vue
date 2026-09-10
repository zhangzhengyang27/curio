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
        <div class="code-header">
          <div class="code-title">
            <svg
              class="code-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <div class="title-text">
              <span class="title-name">{{ title }}</span>
            </div>
          </div>
          <div class="code-actions">
            <button
              class="action-btn header-copy"
              :disabled="!activeSection?.code"
              :title="copiedIndex === activeIndex ? '已复制' : '复制代码'"
              @click="copySection(activeIndex)"
            >
              <svg
                v-if="copiedIndex !== activeIndex"
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg
                v-else
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{{ copiedIndex === activeIndex ? '已复制' : '复制' }}</span>
            </button>
            <button
              class="action-btn close-btn"
              aria-label="关闭"
              title="关闭"
              @click="$emit('close')"
            >
              <svg
                class="action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                />
              </svg>
            </button>
          </div>
        </div>

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
            <pre
              v-else
              class="code-pre"
            ><code
            class="hljs"
            v-html="highlightCode(activeSection.code, activeSection.filename)"
            /></pre>
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
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('json', json)

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '示例源码' },
  // 多节代码：每项 { filename, code }；第 1 节通常是主示例，后续为其引用的 ExampleScene 等
  sections: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const activeIndex = ref(0)
const copiedIndex = ref(-1)
let copyTimer = null

// 当前激活的那一节（tab 选中项）
const activeSection = computed(() => props.sections?.[activeIndex.value] || null)

// tab 标题只取 basename，避免路径过长撑爆 tab 栏
function tabLabel(name) {
  if (!name) return '未命名'
  return name.split('/').pop() || name
}

function langFromFilename(name) {
  if (!name) return 'xml'
  const lower = name.toLowerCase()
  if (lower.endsWith('.vue') || lower.endsWith('.html')) return 'xml'
  if (lower.endsWith('.ts')) return 'typescript'
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.js')) return 'javascript'
  return 'xml'
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 把 .vue 拆成 template/script/style 块，各自用合适语言高亮
// （比整文件当 xml 更准：<script> 里的 JS、<style> 里的 CSS 也会上色）
function highlightVue(code) {
  const blocks = []
  const re = /<(template|script|style)([^>]*)>([\s\S]*?)<\/\1>/gi
  let lastIndex = 0
  let m
  while ((m = re.exec(code))) {
    if (m.index > lastIndex) {
      const between = code.slice(lastIndex, m.index)
      if (between.trim()) {
        blocks.push({ lang: 'xml', code: between })
      } else if (between.length) {
        // 仅含空白（多为 template/script/style 之间的换行）：原样保留，
        // 否则这些换行被丢弃，会导致 </template><script> 等标签被拼到同一行
        blocks.push({ html: escapeHtml(between) })
      }
    }
    const tag = m[1].toLowerCase()
    const attrs = m[2]
    let lang = 'xml'
    if (tag === 'script') {
      lang = /lang=["']ts["']/i.test(attrs) ? 'typescript' : 'javascript'
    } else if (tag === 'style') {
      if (/lang=["'](scss|sass)["']/i.test(attrs)) lang = 'scss'
      else if (/lang=["']less["']/i.test(attrs)) lang = 'less'
      else lang = 'css'
    }
    const openHtml = hljs.highlight(`<${tag}${attrs}>`, { language: 'xml' }).value
    const innerHtml = hljs.getLanguage(lang)
      ? hljs.highlight(m[3], { language: lang }).value
      : escapeHtml(m[3])
    const closeHtml = hljs.highlight(`</${tag}>`, { language: 'xml' }).value
    blocks.push({ html: openHtml + innerHtml + closeHtml })
    lastIndex = re.lastIndex
  }
  if (lastIndex < code.length) {
    const rest = code.slice(lastIndex)
    if (rest.trim()) blocks.push({ lang: 'xml', code: rest })
  }
  return blocks
    .map((b) => (b.html != null ? b.html : hljs.highlight(b.code, { language: b.lang }).value))
    .join('')
}

// 单节高亮：.vue 走分块逻辑，其余按扩展名整体高亮
function highlightCode(code, filename) {
  if (!code) return ''
  if (filename && filename.toLowerCase().endsWith('.vue')) {
    try {
      return highlightVue(code)
    } catch (e) {
      return escapeHtml(code)
    }
  }
  const lang = langFromFilename(filename)
  try {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  } catch (e) {
    return escapeHtml(code)
  }
}

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

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tv-sm);
  padding: var(--tv-sm) var(--tv-md);
  border-bottom: 1px solid var(--tv-outline-variant);
  flex-shrink: 0;
}

.code-title {
  display: flex;
  align-items: center;
  gap: var(--tv-sm);
  min-width: 0;
}

.code-icon {
  width: 18px;
  height: 18px;
  color: var(--tv-primary);
  flex-shrink: 0;
}

.title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--tv-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-actions {
  display: flex;
  align-items: center;
  gap: var(--tv-xs);
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--tv-radius-md);
  border: 1px solid var(--tv-outline-variant);
  background: transparent;
  color: var(--tv-on-surface-variant);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--tv-surface-container);
  color: var(--tv-primary);
  border-color: var(--tv-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 15px;
  height: 15px;
}

.close-btn {
  padding: 0;
  width: 28px;
  justify-content: center;
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

<!-- 语法高亮配色：用项目 --tv-* 语义色，避免引入 hljs 预置主题污染全局；
     作用域限定在 .code-modal 下，跟随 html.dark 自动切换。 -->
<style>
.code-modal .hljs {
  color: var(--tv-on-surface);
  background: transparent;
}

.code-modal .hljs-comment,
.code-modal .hljs-quote {
  color: #6b7280;
  font-style: italic;
}

.code-modal .hljs-keyword,
.code-modal .hljs-selector-tag,
.code-modal .hljs-literal,
.code-modal .hljs-doctag {
  color: #cf222e;
}

.code-modal .hljs-string,
.code-modal .hljs-regexp,
.code-modal .hljs-addition {
  color: #0a3069;
}

.code-modal .hljs-number,
.code-modal .hljs-meta {
  color: #0550ae;
}

.code-modal .hljs-title,
.code-modal .hljs-title.function_,
.code-modal .hljs-section,
.code-modal .hljs-name {
  color: #8250df;
}

.code-modal .hljs-attr,
.code-modal .hljs-attribute,
.code-modal .hljs-tag,
.code-modal .hljs-built_in,
.code-modal .hljs-type {
  color: #116329;
}

.code-modal .hljs-symbol,
.code-modal .hljs-variable,
.code-modal .hljs-template-variable,
.code-modal .hljs-bullet {
  color: #953800;
}

.code-modal .hljs-deletion {
  color: #82071e;
}

/* 暗色主题覆盖 */
html.dark .code-modal .hljs-comment,
html.dark .code-modal .hljs-quote {
  color: #8b949e;
}

html.dark .code-modal .hljs-keyword,
html.dark .code-modal .hljs-selector-tag,
html.dark .code-modal .hljs-literal,
html.dark .code-modal .hljs-doctag {
  color: #ff7b72;
}

html.dark .code-modal .hljs-string,
html.dark .code-modal .hljs-regexp,
html.dark .code-modal .hljs-addition {
  color: #a5d6ff;
}

html.dark .code-modal .hljs-number,
html.dark .code-modal .hljs-meta {
  color: #79c0ff;
}

html.dark .code-modal .hljs-title,
html.dark .code-modal .hljs-title.function_,
html.dark .code-modal .hljs-section,
html.dark .code-modal .hljs-name {
  color: #d2a8ff;
}

html.dark .code-modal .hljs-attr,
html.dark .code-modal .hljs-attribute,
html.dark .code-modal .hljs-tag,
html.dark .code-modal .hljs-built_in,
html.dark .code-modal .hljs-type {
  color: #7ee787;
}

html.dark .code-modal .hljs-symbol,
html.dark .code-modal .hljs-variable,
html.dark .code-modal .hljs-template-variable,
html.dark .code-modal .hljs-bullet {
  color: #ffa657;
}

html.dark .code-modal .hljs-deletion {
  color: #ffa198;
}
</style>
