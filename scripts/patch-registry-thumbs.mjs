// 把截图脚本生成的 scripts/_thumb_map.json 回填进各 registry 文件。
//
// 关键约束：**就地更新 "thumbnail" 的值，不移动字段位置**。
// 字段顺序的唯一事实来源是生成器（generate-registry.js / generate-*-lesson*-registry.js）。
// 本脚本早期版本会把 thumbnail 插到 "id" 之后（并留下一个空行），与生成器输出不一致，
// 于是每次跑完都产生一次「格式漂移」，registry 与生成器再也对不上，
// 漂移检测（generate-* --check）会持续报红。改为就地更新后，重跑本脚本是幂等的。
//
// 用法：node scripts/patch-registry-thumbs.mjs [--dry-run|--force]
// 写入受 registry-guard 保护（默认拒绝写入）。
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWriteFlags, writeRegistry } from './lib/registry-guard.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const REG = path.join(ROOT, 'src/examples/registry')
const WRITE_FLAGS = parseWriteFlags()

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const THUMB_LINE_RE = /^(\s*)["']?thumbnail["']?\s*:\s*["'][^"']*["'](,?)\s*$/
const ID_LINE_RE = /^(\s*)["']?id["']?\s*:\s*["'](.+?)["'],?\s*$/

/**
 * 定位某条目在文件中的行区间 [start, end]（end 为条目闭合花括号所在行）。
 * 同时按 id + category 匹配，避免同名 id 跨分类误伤。
 * 返回 null 表示没找到（交由调用方统计为 SKIP）。
 */
function findEntryRange(lines, id, category) {
  const catRe = new RegExp(`["']?category["']?\\s*:\\s*["']${escapeRegExp(category)}["']`)
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(ID_LINE_RE)
    if (!m || m[2] !== id) continue
    const keyIndent = m[1].length
    let end = lines.length - 1
    for (let j = i + 1; j < lines.length; j++) {
      const cm = lines[j].match(/^(\s*)\}/)
      // 只认「缩进比键更浅」的闭合花括号；条目内嵌对象（如 globals）的 '}' 缩进更深，跳过
      if (cm && cm[1].length < keyIndent) {
        end = j
        break
      }
    }
    if (lines.slice(i, end + 1).some((l) => catRe.test(l))) return { start: i, end }
  }
  return null
}

/** 就地更新条目内的 thumbnail；无该键时追加到条目末尾；重复键时只留第一个 */
function patchEntry(lines, range, thumbnail) {
  const { start, end } = range
  const hits = []
  for (let j = start; j <= end; j++) {
    if (THUMB_LINE_RE.test(lines[j])) hits.push(j)
  }

  if (hits.length) {
    const [, indent, comma] = lines[hits[0]].match(THUMB_LINE_RE)
    lines[hits[0]] = `${indent}"thumbnail": ${JSON.stringify(thumbnail)}${comma}`
    // 删除重复键（后键覆盖前键，留着只会误导）
    for (let k = hits.length - 1; k >= 1; k--) lines.splice(hits[k], 1)
    return hits.length > 1 ? 'updated+deduped' : 'updated'
  }

  // 兜底：条目内没有 thumbnail 键 → 追加到条目末尾，保持生成器决定的字段顺序
  const prev = lines[end - 1]
  if (!/,\s*$/.test(prev)) lines[end - 1] = prev.replace(/\s*$/, '') + ','
  const indentMatch = lines[end].match(/^(\s*)/)
  const indent = indentMatch ? indentMatch[1] : ''
  lines.splice(end, 0, `${indent}  "thumbnail": ${JSON.stringify(thumbnail)}`)
  return 'inserted'
}

async function main() {
  const mapPath = path.join(__dirname, '_thumb_map.json')
  const map = JSON.parse(await readFile(mapPath, 'utf8'))
  // 全部回填：截图失败的项文件不存在，画廊 <img> 的 @error 会优雅降级为占位符
  if (!map.length) {
    console.log('映射为空，跳过')
    return
  }

  const bySource = {}
  for (const m of map) (bySource[m.source] ||= []).push(m)

  const files = (await readdir(REG)).filter((f) => f.endsWith('.js'))
  const stats = { updated: 0, inserted: 0, deduped: 0, skipped: 0 }

  for (const f of files) {
    const mod = await import(path.join(REG, f))
    const src = mod.default && mod.default.source
    const entries = src && bySource[src]
    if (!entries || !entries.length) continue

    const filePath = path.join(REG, f)
    const text = await readFile(filePath, 'utf8')
    const lines = text.split('\n')

    for (const e of entries) {
      // 每次重新定位：上一轮可能插入/删除了行，行号会漂移
      const range = findEntryRange(lines, e.id, e.category)
      if (!range) {
        stats.skipped++
        console.log(`SKIP 未匹配: ${src} / ${e.category} / ${e.id}`)
        continue
      }
      const action = patchEntry(lines, range, e.thumbnail)
      if (action === 'inserted') stats.inserted++
      else if (action === 'updated+deduped') {
        stats.updated++
        stats.deduped++
      } else stats.updated++
    }

    writeRegistry(filePath, lines.join('\n'), WRITE_FLAGS, 'patch-registry-thumbs.mjs')
  }

  console.log(
    `回填完成: 就地更新 ${stats.updated}, 新增 ${stats.inserted}, ` +
      `去重 ${stats.deduped}, 跳过 ${stats.skipped}`
  )
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
