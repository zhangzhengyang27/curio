import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import json from 'highlight.js/lib/languages/json'

/**
 * 源码语法高亮（纯逻辑，与 UI 无关）。
 *
 * 从 src/components/CodeDrawer.vue 抽出：CodeDrawer 曾是 675 行的巨石组件，
 * 其中约 130 行是「加载语言包 + 解析 .vue 分块 + 转义」这类与渲染无关的逻辑。
 * 抽出来后既缩小了组件，也让高亮行为可以被单独测试/复用。
 *
 * 说明：
 * - 语言包在模块作用域注册一次即可（hljs 是单例）
 * - .vue 会被拆成 template / script / style 分别高亮，否则整份当 xml 只有标签上色
 */

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('json', json)

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 根据文件名推断高亮语言 */
export function langFromFilename(name: string | null | undefined): string {
  if (!name) return 'xml'
  const lower = name.toLowerCase()
  if (lower.endsWith('.vue') || lower.endsWith('.html')) return 'xml'
  if (lower.endsWith('.ts')) return 'typescript'
  if (lower.endsWith('.css')) return 'css'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.js')) return 'javascript'
  return 'xml'
}

type HighlightBlock = { lang: string; code: string; html?: undefined } | { html: string; lang?: undefined; code?: undefined }

/**
 * 把 .vue 拆成 template/script/style 块，各自用合适语言高亮。
 * @returns 可直接 v-html 的 HTML 字符串
 */
export function highlightVue(code: string): string {
  const blocks: HighlightBlock[] = []
  const re = /<(template|script|style)([^>]*)>([\s\S]*?)<\/\1>/gi
  let lastIndex = 0
  let m: RegExpExecArray | null
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

/**
 * 单节高亮：.vue 走分块逻辑，其余按扩展名整体高亮。
 * 任何异常都降级为「纯转义文本」，不让弹窗白屏。
 */
export function highlightCode(code: string, filename?: string): string {
  if (!code) return ''
  if (filename && filename.toLowerCase().endsWith('.vue')) {
    try {
      return highlightVue(code)
    } catch {
      return escapeHtml(code)
    }
  }
  const lang = langFromFilename(filename)
  try {
    if (hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return escapeHtml(code)
  }
}

/** tab 标题只取 basename，避免路径过长撑爆 tab 栏 */
export function tabLabel(name: string | null | undefined): string {
  if (!name) return '未命名'
  return name.split('/').pop() || name
}

/** 在组件 setup 中调用，取得高亮相关方法 */
export function useCodeHighlight() {
  return { highlightCode, tabLabel, langFromFilename, escapeHtml, highlightVue }
}
