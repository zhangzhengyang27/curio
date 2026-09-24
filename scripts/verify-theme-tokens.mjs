#!/usr/bin/env node
/**
 * 主题令牌 / 对比度守卫。
 *
 * 背景：7b00e25「全站视觉重构」把基调统一成深空暗色，但 /bmap 被漏掉了 ——
 * `.bmap-tab` 写成 `color: inherit` + 硬编码 `background: #f3f4f6`，
 * 暗色下变成白字白底（实测对比度 1.15:1，AA 要求 4.5:1），
 * 那一页 47 个导航按钮整排不可读。
 *
 * 关键是：**这一整类缺陷当时没有任何闸门能看见**。verify 七环、typecheck、
 * lint:ci 都不读 CSS 值，所以它能从重构当天一直活到审计当天。
 * 本脚本把这类问题变成构建期失败，不再依赖人眼走查。
 *
 * 做两件事：
 *   1. 静态对比度：同一条规则里 color 与 background 都是字面量时，
 *      算 WCAG 2.1 对比度，低于 4.5 直接失败（不看基线，新缺陷零容忍）
 *   2. 硬编码色值棘轮（ratchet）：逐文件统计绕过 --tv-* 令牌的字面量数量，
 *      只允许比基线更少，不允许更多。存量在 P1-1 逐批改，改完 --update 收紧
 *
 * 用法：
 *   node scripts/verify-theme-tokens.mjs            # 校验（CI 使用）
 *   node scripts/verify-theme-tokens.mjs --report    # 只打印清单与计数，不比对基线
 *   node scripts/verify-theme-tokens.mjs --update    # 收紧基线（每完成一批 token 化后跑）
 *
 * 排除范围见 SKIP_DIRS：抓来的三方示例（src/examples/components/**）与令牌定义本身不参与。
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const SRC = join(ROOT, 'src')
const BASELINE = join(ROOT, 'scripts', '_theme_token_baseline.json')

/** 不参与守卫的目录：三方抓取示例、vendored 构建产物、令牌定义 */
const SKIP_DIRS = [
  ['src', 'examples', 'components'].join(sep),
  ['src', 'examples', 'jsm-compat'].join(sep),
  ['src', 'examples', 'three-build-compat'].join(sep),
  ['src', 'examples', 'registry'].join(sep),
]
/**
 * theme.css 是令牌定义本身；code-highlight.css 是代码高亮配色表 ——
 * 它按语言 token 类型给色，与界面主题正交，套 --tv-* 反而会让语法色失去意义。
 */
const SKIP_FILES = [join('src', 'styles', 'theme.css'), join('src', 'styles', 'code-highlight.css')]

const MIN_CONTRAST = 4.5

const args = process.argv.slice(2)
const MODE = args.includes('--update') ? 'update' : args.includes('--report') ? 'report' : 'check'

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = relative(ROOT, full)
    if (SKIP_DIRS.some(s => rel === s || rel.startsWith(s + sep))) continue
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else if ((name.endsWith('.vue') || name.endsWith('.css')) && !SKIP_FILES.includes(rel)) yield rel
  }
}

/** 抽出文件里所有 <style> 块的内容；.css 文件整份即样式 */
function styleBlocksOf(rel) {
  const text = readFileSync(join(ROOT, rel), 'utf8')
  if (rel.endsWith('.css')) return [text]
  const out = []
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(text))) out.push(m[1])
  return out
}

/** 去注释，但保留 theme-tokens:allow 这类指令，否则下一行的豁免会失效 */
const stripComments = css =>
  css.replace(/\/\*[\s\S]*?\*\//g, m => (m.includes('theme-tokens:allow') ? m : ''))

/**
 * 把 var(...) 整体摘掉再扫描 —— 里面的十六进制是**令牌回退值**，不是绕过令牌。
 * 不处理的话 `background: var(--tv-primary, #4f8ef7)` 会被误报成硬编码，
 * 而误报的代价是让人开始无视这个闸门，那它就等于没有了。
 * 反复替换最内层，兼容 var(--a, var(--b, #fff)) 这种嵌套写法。
 */
function stripVar(css) {
  let out = css
  // 占位符不能再写成 var(...)，否则下一轮仍匹配得上，这里就是死循环
  while (/var\([^()]*\)/.test(out)) out = out.replace(/var\([^()]*\)/g, '__TV_VAR__')
  return out
}

const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g

/** 阴影/滤镜里的半透明黑白属于「高度」表达，不是主题面，不计入 */
function isElevationLine(line) {
  return /\b(?:box-shadow|text-shadow|filter|backdrop-filter|drop-shadow)\s*:/.test(line)
    && /rgba?\(\s*(?:0,\s*0,\s*0|255,\s*255,\s*255)\s*[,/]/i.test(line)
}

function countLiterals(css) {
  let n = 0
  let pendingAllow = false
  for (const line of css.split('\n')) {
    if (line.includes('theme-tokens:allow')) {
      // 标记写在被豁免行的**上一行**（CSS 里只能这样），所以置位给下一行用
      pendingAllow = true
      continue
    }
    if (pendingAllow) {
      pendingAllow = false
      if (line.trim()) continue
    }
    if (isElevationLine(line)) continue
    const hits = line.match(COLOR_RE)
    if (hits) n += hits.length
  }
  return n
}

function parseColor(token) {
  const t = token.trim()
  let m = /^#([0-9a-fA-F]{3,8})$/.exec(t)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map(c => c + c).join('')
    else if (h.length === 6 || h.length === 8) h = h.slice(0, 6)
    else return null
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  }
  m = /^rgba?\(([^)]+)\)$/.exec(t)
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    if (parts.length < 3 || parts.some(Number.isNaN)) return null
    const alpha = parts.length > 3 ? parts[3] : 1
    return alpha >= 1 ? parts.slice(0, 3) : null
  }
  return null
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

/** 同一条规则里 color 与 background 都是字面量 → 可直接算对比度 */
function findContrastFailures(rel, css) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css))) {
    const selector = m[1].trim().replace(/\s+/g, ' ')
    const body = m[2]
    if (body.includes('theme-tokens:allow') || selector.includes('theme-tokens:allow')) continue
    const fg = /(?:^|;)\s*color\s*:\s*([^;]+)/.exec(body)
    const bg = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/.exec(body)
    if (!fg || !bg) continue
    const fgLit = fg[1].match(COLOR_RE)
    const bgLit = bg[1].match(COLOR_RE)
    if (!fgLit || !bgLit) continue
    const rgbFg = parseColor(fgLit[0])
    const rgbBg = parseColor(bgLit[0])
    if (!rgbFg || !rgbBg) continue
    const ratio = contrastRatio(rgbFg, rgbBg)
    if (ratio < MIN_CONTRAST) {
      out.push({ rel, selector, ratio: +ratio.toFixed(2), fg: fgLit[0], bg: bgLit[0] })
    }
  }
  return out
}

const counts = new Map()
const contrastFailures = []

for (const rel of walk(SRC)) {
  let total = 0
  for (const block of styleBlocksOf(rel)) {
    const css = stripVar(stripComments(block))
    total += countLiterals(css)
    contrastFailures.push(...findContrastFailures(rel, css))
  }
  if (total > 0) counts.set(rel, total)
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
const grandTotal = sorted.reduce((s, [, n]) => s + n, 0)

if (MODE === 'report') {
  for (const [rel, n] of sorted) console.log(String(n).padStart(4), rel)
  console.log(`\n文件 ${sorted.length} 个 / 硬编码色值 ${grandTotal} 处`)
  console.log(`静态对比度不达标 ${contrastFailures.length} 条`)
  for (const f of contrastFailures) {
    console.log(`  ${f.rel}  ${f.selector}  ${f.fg} on ${f.bg} = ${f.ratio}:1`)
  }
  process.exit(0)
}

if (MODE === 'update') {
  const payload = {
    _comment: 'verify-theme-tokens.mjs 的棘轮基线：每个文件允许的硬编码色值上限。只允许下降；改完一批 token 化后跑 `node scripts/verify-theme-tokens.mjs --update` 收紧。',
    files: Object.fromEntries(sorted),
  }
  writeFileSync(BASELINE, JSON.stringify(payload, null, 2) + '\n')
  console.log(`[OK] 基线已写入 ${relative(ROOT, BASELINE)}：${sorted.length} 个文件 / ${grandTotal} 处`)
  process.exit(0)
}

// ---- check ----
const errors = []

if (!existsSync(BASELINE)) {
  console.error('[verify-theme-tokens] 缺少基线文件，先跑：node scripts/verify-theme-tokens.mjs --update')
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')).files || {}

for (const [rel, n] of sorted) {
  const allowed = baseline[rel] ?? 0
  if (n > allowed) {
    errors.push(
      allowed === 0
        ? `${rel} 引入了 ${n} 处硬编码色值，该文件基线为 0（已 token 化，请保持）`
        : `${rel} 硬编码色值 ${allowed} → ${n}，增加了 ${n - allowed} 处`
    )
  }
}

for (const f of contrastFailures) {
  errors.push(`对比度不达标：${f.rel}  ${f.selector}  ${f.fg} on ${f.bg} = ${f.ratio}:1（需 ≥ ${MIN_CONTRAST}:1）`)
}

if (errors.length) {
  console.error(`[verify-theme-tokens] 失败（${errors.length} 条）：`)
  for (const e of errors) console.error('  - ' + e)
  console.error('\n色值请改用 src/styles/theme.css 里的 --tv-* 令牌。')
  console.error('注意：传给地图 SDK 的 JS 数据色（strokeColor/fillColor 等）不在本守卫范围内，')
  console.error('      那些位置 CSS 变量根本不生效，不要为了降数字去改。')
  process.exit(1)
}

console.log(`[verify-theme-tokens] OK —— 硬编码色值 ${grandTotal} 处，未超出基线；静态对比度全部 ≥ ${MIN_CONTRAST}:1`)
