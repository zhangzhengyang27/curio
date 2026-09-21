#!/usr/bin/env node
/**
 * 一次性 codemod：把 tools-examples 面板里那套写死的深空配色换成 --tv-* 令牌。
 *
 * 只处理 6 条**语义一一对应、无上下文歧义**的映射，且只作用于 <style> 块内。
 * #fff / #000 / rgb(255 255 255 / N%) 一律不碰 —— 它们该换成 on-primary 还是
 * on-surface 取决于压在什么底色上，必须逐处看。
 *
 * 用完即可删除；守卫在 scripts/verify-theme-tokens.mjs。
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 本脚本在 scripts/legacy/ 下，仓库根是上三级
const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')
const DIR = join(ROOT, 'src/views/tools-examples')

const MAP = {
  '#dce7f2': 'var(--tv-on-surface)',
  '#b9c6d4': 'var(--tv-on-surface-variant)',
  '#9fd0a8': 'var(--tv-success)',
  '#7fff9f': 'var(--tv-success)',
  '#4da3ff': 'var(--tv-primary)',
  '#4f8ef7': 'var(--tv-primary)',
  '#8ec9ff': 'var(--tv-primary)',
  '#eee': 'var(--tv-outline-variant)',
}

let filesTouched = 0
let repls = 0

for (const name of readdirSync(DIR).filter(f => f.endsWith('.vue'))) {
  const path = join(DIR, name)
  const src = readFileSync(path, 'utf8')
  let count = 0
  // 只在 <style>…</style> 内替换，避免动到模板字符串或 JS 里的 SDK 数据色
  const out = src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_, open, css, close) => {
    const next = css.replace(/#[0-9a-fA-F]{3,8}\b/g, hex => {
      const rep = MAP[hex.toLowerCase()]
      if (!rep) return hex
      count++
      return rep
    })
    return open + next + close
  })
  if (count > 0) {
    writeFileSync(path, out)
    filesTouched++
    repls += count
    console.log(`${String(count).padStart(3)}  ${name}`)
  }
}

console.log(`\n替换 ${repls} 处，涉及 ${filesTouched} 个文件`)
