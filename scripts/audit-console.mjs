#!/usr/bin/env node
/**
 * 示例层 console 调用审计。
 *
 * 背景：示例层有 800+ 处 console 调用。直觉上「全删」，但实测分类后发现
 * 大部分是**有意的**：
 *   - 65 处是 Element Plus 的 ElMessage 替代实现（真实 UI 组件不可用，用 console 兜底）
 *   - 285 处 console.error / 21 处 console.warn 是错误与告警
 *   - 大量 console.log 是教学示例的演示输出（如 three-project 课程里的
 *     `console.log('顶点位置数据', geometry1)`，本身就是教学内容）
 *
 * 因此本脚本只做**分类与线索输出**，不自动删除。
 * 是否清理、清理哪些，需要人工按分类决定（见 docs/ROADMAP.md）。
 *
 * 用法：node scripts/audit-console.mjs [目录]   默认 src/examples/components
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = resolve(fileURLToPath(import.meta.url), '../..')
const TARGET = process.argv[2] || 'src/examples/components'

const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.vue'])

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else if (TEXT_EXT.has(extname(name))) yield full
  }
}

const buckets = {
  error: [], // console.error —— 保留
  warn: [], // console.warn  —— 保留
  info: [], // console.info  —— 保留
  elMessageShim: [], // ElMessage 替代实现 —— 保留（去掉就没有用户反馈了）
  teaching: [], // 带语义文案的演示输出 —— 保留
  suspicious: [], // 疑似调试噪声 —— 需人工确认后决定是否删除
}
const commented = [] // 已注释掉的（死代码，无害）

for (const file of walk(join(REPO, TARGET))) {
  const text = readFileSync(file, 'utf8')
  const rel = relative(REPO, file)
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim()
    if (!/console\.(log|debug|info|warn|error)\s*\(/.test(trimmed)) return
    const item = { file: rel, line: i + 1, text: trimmed.slice(0, 120) }
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      commented.push(item)
      return
    }
    if (/console\.error\s*\(/.test(trimmed)) return void buckets.error.push(item)
    if (/console\.warn\s*\(/.test(trimmed)) return void buckets.warn.push(item)
    if (/console\.info\s*\(/.test(trimmed)) return void buckets.info.push(item)
    if (/ElMessage|console\.log\('\[/.test(trimmed)) return void buckets.elMessageShim.push(item)
    // 带中文或较长英文文案 → 判为教学演示输出
    if (/[一-龥]/.test(trimmed) || /console\.log\(\s*['"`][^'"`]{6,}/.test(trimmed)) {
      return void buckets.teaching.push(item)
    }
    buckets.suspicious.push(item)
  })
}

const total = Object.values(buckets).reduce((a, b) => a + b.length, 0)
console.log(`[audit-console] 扫描目录：${TARGET}`)
console.log(`[audit-console] console 调用总数：${total}（另有 ${commented.length} 处已注释，属死代码、无害）\n`)

const rows = [
  ['console.error（保留：错误诊断）', buckets.error],
  ['console.warn（保留：告警）', buckets.warn],
  ['console.info（保留）', buckets.info],
  ['ElMessage / 带 [tag] 的实现（保留：UI 替代或带来源标记）', buckets.elMessageShim],
  ['教学演示输出（保留：示例本身的教学内容）', buckets.teaching],
  ['⚠ 疑似调试噪声（需人工确认）', buckets.suspicious],
]

for (const [label, list] of rows) {
  console.log(`${label}：${list.length}`)
}

console.log('\n=== 疑似调试噪声明细（如需清理，请逐个确认）===')
for (const it of buckets.suspicious) console.log(`  ${it.file}:${it.line}  ${it.text}`)

console.log('\n[audit-console] 本脚本不修改任何文件。')
console.log('            建议：分类 1–5 一律保留；疑似噪声如需批量降噪，')
console.log('            可在生产构建中丢弃 console.log（Vite: build.esbuild.pure），')
console.log('            而不是改动示例源码。')
