#!/usr/bin/env node
/**
 * 令牌对比度守卫(常驻闸门,2026-09-29 M3a Task 1 转正)。
 *
 * 分工:verify-theme-tokens.mjs 管「组件里的硬编码色值棘轮 + 同规则字面量对比度」;
 * 本脚本管「theme.css 令牌值本身」——对内置的关键「文字/背景令牌对」逐对做 WCAG 实测。
 * 由来:M2 终审发现命令面板 placeholder 用 --cu-outline 暗色实测 1.9:1,
 * 字面量棘轮与人工枚举都拦不住它;零容忍必须有执行体。
 *
 * 只读 theme.css 的令牌值,不扫组件 CSS;rgba 半透明表面先按各自主题的
 * --cu-background 合成(玻璃面板的实际观感),再算对比度。
 *
 * 用法:node scripts/verify-contrast.mjs   # 任一文字对 < 4.5 → 退出码 1
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const CSS = readFileSync(join(ROOT, 'src', 'styles', 'theme.css'), 'utf8')

/** 提取某类选择器块内的 --cu-* 令牌表;同名令牌多块时后者覆盖前者 */
function tokensOf(selectorRe) {
  const map = {}
  const blocks = [...CSS.matchAll(new RegExp(selectorRe.source, 'g'))]
  if (!blocks.length) throw new Error(`theme.css 里找不到 ${selectorRe} 块`)
  for (const m of blocks) {
    for (const [, name, value] of m[1].matchAll(/--cu-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      map[name] = value.trim()
    }
  }
  return map
}

const light = tokensOf(/:root\s*\{([^}]*)\}/)
const dark = { ...light, ...tokensOf(/html\.dark\s*\{([^}]*)\}/) }
// 假绿防护:html.dark 块将来被拆散/挪走时,覆写数会骤降——直接失败而不是带着残缺的暗色表继续绿
const darkOverrides = Object.keys(dark).filter(k => dark[k] !== light[k])
if (darkOverrides.length < 20) {
  throw new Error(`html.dark 覆写令牌仅 ${darkOverrides.length} 个(预期 ≥20)——theme.css 结构变了?先修本脚本的解析`)
}

function parseColor(raw) {
  const t = raw.trim()
  let m = /^#([0-9a-fA-F]{3,8})$/.exec(t)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map(c => c + c).join('')
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  }
  m = /^rgba?\(([^)]+)\)$/.exec(t)
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    const alpha = parts.length > 3 ? parts[3] : 1
    return { rgb: parts.slice(0, 3), alpha }
  }
  throw new Error(`无法解析的令牌色值:${t}`)
}

/** 解析令牌为不透明 RGB;半透明色按同主题 background 一次性合成(与玻璃面板观感一致) */
function resolveColor(map, name) {
  const c = parseColor(map[name])
  if (Array.isArray(c)) return c
  if (c.alpha >= 1) return c.rgb
  const bg = resolveColor(map, 'background')
  return c.rgb.map((v, i) => Math.round(v * c.alpha + bg[i] * (1 - c.alpha)))
}

function contrastRatio(fg, bg) {
  const lum = rgb => {
    const [r, g, b] = rgb.map(v => {
      const x = v / 255
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const a = lum(fg)
  const b = lum(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** 关键文字对:[主题, 前景令牌, 背景令牌, 说明] —— 4.5:1 硬闸门 */
const TEXT_PAIRS = [
  ['dark', 'on-surface', 'surface-container-lowest', '正文 vs 最底面板'],
  ['dark', 'on-surface', 'surface-container-high', '正文 vs 次高面板'],
  ['dark', 'on-surface', 'surface-container-highest', '正文 vs 最高面板'],
  ['dark', 'on-surface-variant', 'surface-container-lowest', '次级文字 vs 最底面板'],
  ['dark', 'on-surface-variant', 'surface-container', '次级文字 vs 中间面板'],
  ['dark', 'on-surface-variant', 'surface-container-high', '次级文字 vs 次高面板(placeholder 现行令牌)'],
  ['dark', 'on-primary', 'primary', '主按钮文字'],
  ['dark', 'on-primary-container', 'primary-container', '容器按钮文字'],
  ['light', 'on-surface', 'surface-container', '正文 vs 面板'],
  ['light', 'on-surface-variant', 'surface-container-low', '次级文字 vs 面板'],
  ['light', 'on-primary', 'primary', '主按钮文字'],
  ['light', 'on-primary-container', 'primary-container', '容器按钮文字'],
]

/** 数据语义色是图形不是正文,按 WCAG 图形件 3:1 校验(信息级,不失败) */
const DATA_PAIRS = [
  ['dark', 'data-quake', 'background'],
  ['dark', 'data-layer', 'background'],
  ['dark', 'data-track', 'background'],
  ['light', 'data-quake', 'background'],
  ['light', 'data-layer', 'background'],
]

let failures = 0
for (const [theme, fgName, bgName, note] of TEXT_PAIRS) {
  const map = theme === 'dark' ? dark : light
  const ratio = contrastRatio(resolveColor(map, fgName), resolveColor(map, bgName))
  const ok = ratio >= 4.5
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1  [${theme}] ${fgName} on ${bgName} — ${note}`)
}
for (const [theme, fgName, bgName] of DATA_PAIRS) {
  const map = theme === 'dark' ? dark : light
  const ratio = contrastRatio(resolveColor(map, fgName), resolveColor(map, bgName))
  console.log(`${ratio >= 3 ? 'PASS' : 'WARN'}  ${ratio.toFixed(2)}:1  [${theme}] ${fgName} on ${bgName} — 图形件 3:1`)
}

// ── placeholder 用法扫描 ──
// placeholder 是对比度事故惯犯(M2 终审 CommandPalette 1.9:1、M3a 终审 SearchBox/顶栏搜索
// 仍是 --cu-outline 1.91:1——令牌对清单永远查不到「用法」,必须查用法本身):
// 所有 ::placeholder 的 color 只允许 on-surface / on-surface-variant 令牌,禁止字面量。
import { readdirSync, statSync } from 'node:fs'
import { relative as relPath } from 'node:path'

const PLACEHOLDER_ALLOWED = new Set(['on-surface', 'on-surface-variant'])
const SKIP = [
  join('src', 'examples', 'components'),
  join('src', 'examples', 'jsm-compat'),
  join('src', 'examples', 'three-build-compat'),
  join('src', 'examples', 'registry'),
  join('src', 'styles', 'theme.css'),
  join('src', 'styles', 'code-highlight.css'),
]

function* walkSrc(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = relPath(ROOT, full)
    if (SKIP.some(s => rel === s || rel.startsWith(s + '\\') || rel.startsWith(s + '/'))) continue
    const st = statSync(full)
    if (st.isDirectory()) yield* walkSrc(full)
    else if (name.endsWith('.vue') || name.endsWith('.css')) yield rel
  }
}

const PH_RULE = /::placeholder\s*\{[^}]*\}/g
const COLOR_DECL = /color\s*:\s*([^;]+)/

for (const rel of walkSrc(join(ROOT, 'src'))) {
  const text = readFileSync(join(ROOT, rel), 'utf8')
  for (const rule of text.match(PH_RULE) ?? []) {
    const decl = COLOR_DECL.exec(rule)
    if (!decl) continue
    const value = decl[1].trim()
    const varName = /^var\(--cu-([a-z0-9-]+)/.exec(value)
    const ok = varName ? PLACEHOLDER_ALLOWED.has(varName[1]) : false
    if (!ok) {
      failures++
      console.log(`FAIL  placeholder 用法违规  ${rel} — color: ${value}(只允许 var(--cu-on-surface[-variant]))`)
    }
  }
}

if (failures) {
  console.error(`\n[verify-contrast] ${failures} 处失败 —— 调整 theme.css 对应令牌值或用法,不要改本清单来让失败消失`)
  process.exit(1)
}
console.log(`\n[verify-contrast] OK —— ${TEXT_PAIRS.length} 对关键文字对全部 ≥ 4.5:1,placeholder 用法全部合规`)
