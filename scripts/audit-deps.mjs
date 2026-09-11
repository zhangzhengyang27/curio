#!/usr/bin/env node
/**
 * 依赖使用情况审计。
 *
 * 目的：本项目 dependencies 里同时塞着「产品运行时依赖」与「1400+ 示例的专用依赖」，
 * 长期累积后很难判断某个包还需不需要。本脚本给出粗粒度线索，**不自动改 package.json**
 * （误删依赖会直接导致示例白屏）。
 *
 * 用法：node scripts/audit-deps.mjs
 *
 * 判定口径（命中任一即视为「在用」）：
 *   1. src        —— 应用与示例源码里的 import / require / 裸路径引用（决定打包产物）
 *   2. public     —— 静态示例素材里的路径引用（运行时加载，不参与打包）
 *   3. config     —— 根配置文件里的整串包名（alias replacement、optimizeDeps.include、
 *                    分包 test 正则等，这些位置包名是裸露字符串）
 *   4. bin        —— 通过 npm scripts 调用的命令行工具（eslint / prettier / tsc 等，
 *                    bin 名可能与包名不同，例如 typescript 的 bin 是 tsc）
 *   5. types      —— `@types/*` 类型声明包，按 tsconfig 处理，不计入待移除候选
 *
 * 注意：命中 ≠ 必需。很多是示例代码引用，删掉对应示例才能真正删依赖。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = fileURLToPath(import.meta.url)
const REPO = resolve(HERE, '../..')

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vite', 'test-results', 'playwright-report'])
const TEXT_EXT = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.html', '.json', '.css', '.md', '.yml', '.yaml',
])
// 注意：刻意不含 package.json —— 它「声明」依赖（"three": "^0.185.0"），
// 扫它会让每个包都命中一次，彻底污染结论。package.json 只用于提取 scripts 做 bin 判定。
const CONFIG_FILES = [
  'vite.config.js',
  'eslint.config.js',
  'playwright.config.js',
  'tsconfig.json',
  'tsconfig.node.json',
]

function* walk(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) yield* walk(full)
    else if (TEXT_EXT.has(extname(name))) yield full
  }
}

const read = (p) => {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return ''
  }
}

const pkg = JSON.parse(read(join(REPO, 'package.json')))
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
const names = Object.keys(deps).sort()

// ---- 语料 ----
const strictCorpus = [] // src + public：只认 import/require/裸路径
for (const dir of ['src', 'public']) {
  for (const f of walk(join(REPO, dir))) strictCorpus.push({ file: f, text: read(f) })
}

// config：允许「整串包名」出现（alias / optimizeDeps / 分包 test 等位置）
const configCorpus = CONFIG_FILES.map((f) => ({ file: f, text: read(join(REPO, f)) }))

// bin：npm scripts 里出现的命令行工具名
const scriptsText = Object.values(pkg.scripts || {}).join(' ; ')
const toolingText = scriptsText + '\n' + configCorpus.map((c) => c.text).join('\n')

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function binsOf(name) {
  const p = JSON.parse(read(join(REPO, 'node_modules', name, 'package.json')) || 'null')
  if (!p?.bin) return []
  // bin 为字符串时代表「bin 文件路径」，命令名即包名（如 prettier 的 "./bin/prettier.cjs"）；
  // bin 为对象时，键才是命令名（如 eslint 的 { "eslint": "bin/eslint.js" }）。
  return typeof p.bin === 'string' ? [name] : Object.keys(p.bin)
}

const rows = []

for (const name of names) {
  const layers = new Set()
  const e = esc(name)
  const strictRe = new RegExp(
    `(?:from\\s*|require\\(\\s*|import\\(\\s*|export\\s+[^;]*?from\\s*)['"\`]${e}(?:['"\`]|/)`
  )
  const pathRe = new RegExp(`['"\`]${e}/`)
  const looseRe = new RegExp(`['"\`]${e}['"\`]`)

  for (const { text } of strictCorpus) {
    if (strictRe.test(text) || pathRe.test(text)) {
      layers.add('src/public')
      break
    }
  }
  // config 层既可能 import 包（vite.config.js 引 vite），也可能把包名写成裸字符串
  // （alias 的 replacement、optimizeDeps.include、分包 test 正则、tsconfig 的 types 数组）
  for (const { text } of configCorpus) {
    if (strictRe.test(text) || pathRe.test(text) || looseRe.test(text)) {
      layers.add('config')
      break
    }
  }

  // 通过命令行使用（bin 名可能与包名不同）
  const bins = binsOf(name)
  const binHit = bins.some((b) => new RegExp(`(^|[^\\w@/-])${esc(b)}(\\s|$)`).test(scriptsText))
  if (binHit) layers.add('bin')

  if (name.startsWith('@types/')) layers.add('types')

  rows.push({ name, layers: [...layers] })
}

const unused = rows.filter((r) => r.layers.length === 0).map((r) => r.name)

const fmt = (n) => `  ${n.padEnd(42)} ${deps[n]}`

console.log(
  `[audit-deps] 依赖总数：${names.length}（dependencies ${Object.keys(pkg.dependencies || {}).length}` +
    ` + devDependencies ${Object.keys(pkg.devDependencies || {}).length}）`
)

console.log(`\n=== 1) 未检测到任何引用，可优先评估移除（${unused.length} 个）===`)
if (!unused.length) console.log('  （无）')
for (const n of unused) console.log(fmt(n))

console.log('\n=== 2) 完整判定结果 ===')
for (const { name, layers } of rows) {
  const mark = layers.length ? layers.join(' + ') : '⚠ 未检测到引用'
  console.log(`  ${name.padEnd(42)} ${mark}`)
}

console.log('\n=== 3) 统计 ===')
const byLayer = {}
for (const { layers } of rows) for (const l of layers) byLayer[l] = (byLayer[l] || 0) + 1
for (const [k, v] of Object.entries(byLayer).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(12)} ${v}`)
}

console.log('\n[audit-deps] 提示：本脚本只输出线索，不修改 package.json。')
console.log('            移除依赖后必须跑 npm run verify + npm run build + npm run test:e2e 验证。')
console.log('            注意 public/ 命中代表「示例素材按路径加载」，删依赖前需确认对应示例。')
void relative
